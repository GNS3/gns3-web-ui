import { Injectable, computed, signal } from '@angular/core';
import { Subject, Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { select } from 'd3-selection';
import { Controller } from '@models/controller';
import {
  DetailState,
  PinnedDetail,
  ReplayBucket,
  ReplayFrame,
  ReplayFrameDetail,
  ReplayFramesResponse,
  ReplayRangeResponse,
  TimelineMode,
} from '@models/marker-replay';
import { HttpController } from './http-controller.service';
import { ToasterService } from './toaster.service';

/** Full-identity tuple equality — ts alone is NOT unique (two links, same µs). */
export function sameReplayFrame(a: ReplayFrame, b: ReplayFrame): boolean {
  return (
    a.ts === b.ts &&
    a.node_id === b.node_id &&
    a.link_id === b.link_id &&
    a.marker === b.marker &&
    a.frame_number === b.frame_number
  );
}

/** Cache key = identity tuple (ts alone would collide across links). */
const detailKey = (f: ReplayFrame) => `${f.ts}\x00${f.node_id}\x00${f.link_id}\x00${f.marker}`;

/** How long the index must be stable before the detail (tshark) request fires. */
export const DETAIL_DEBOUNCE_MS = 200;
/** How long a bucket must stay current before it materializes its frames. */
export const BUCKET_SETTLE_MS = 200;
const DETAIL_CACHE_CAP = 50;
const BOOKMARK_CAP = 100;
/** Max frozen comparison windows per session; the oldest pin drops past it. */
const PINNED_CAP = 8;
/** Materialized seconds kept for instant revisit (frames are shared refs). */
const MATERIALIZED_CAP = 60;
/** Persistent CSS class on the current frame's link path (styled in styles.scss). */
const LINK_HIGHLIGHT_CLASS = 'marker-replay-active';

/** Why the range fetch failed — gate/missing close the overlay, network retries inline. */
export type RangeErrorKind = 'gate' | 'missing' | 'network';

/**
 * REST client + session state for marker tag aggregated replay.
 *
 * Component-scoped (provided by the replay overlay, dies with it — every cache
 * and signal below is per-session by construction). Two deliberately separated
 * performance regimes mirror the server contract:
 *  - **Timeline browsing** — one `range` call (+ one `frames` call per settled
 *    second in truncated/bucket mode); NEVER invokes tshark.
 *  - **Frame detail** — one tshark decode per frame the user settles on,
 *    debounced ({@link DETAIL_DEBOUNCE_MS}) so continuous scrubbing issues zero
 *    requests; stale in-flight requests are cancelled (switchMap). 501/502
 *    affects the opened frame only.
 *
 * Contract red lines enforced here:
 *  - `ts` round-trips VERBATIM — frames are navigated by ARRAY INDEX (server
 *    order is authoritative, never re-sorted), frame objects travel whole, and
 *    the only `Number(ts)` uses live in replay-timeline-math.ts (display).
 *  - The `range` response branches on `truncated` BEFORE touching `frames`.
 */
@Injectable()
export class MarkerReplayService {
  constructor(
    private httpController: HttpController,
    private toaster: ToasterService
  ) {}

  // ---- HTTP --------------------------------------------------------------

  /**
   * Timeline metadata + the full merged frame list (cap 5000). Over the cap the
   * response carries `truncated: true` and `buckets` instead of `frames` —
   * branch on `truncated` before touching `frames`. `start`/`end` are null when
   * nothing was captured.
   */
  replayRange(
    controller: Controller,
    projectId: string,
    tag: number
  ): Observable<ReplayRangeResponse> {
    return this.httpController.get<ReplayRangeResponse>(
      controller,
      `/projects/${projectId}/markers/tags/${tag}/replay/range`
    );
  }

  /**
   * Frames with ts in `[ts, ts + windowMs]`, merged across every source of the
   * tag. An empty window is a NORMAL, successful answer (`{"frames": []}`).
   * `ts` is interpolated verbatim — typically a bucket's "….000000" string.
   */
  replayFrames(
    controller: Controller,
    projectId: string,
    tag: number,
    ts: string,
    windowMs: number = 1000,
    limit: number = 1000
  ): Observable<ReplayFramesResponse> {
    return this.httpController.get<ReplayFramesResponse>(
      controller,
      `/projects/${projectId}/markers/tags/${tag}/replay/frames?ts=${ts}&window_ms=${windowMs}&limit=${limit}`
    );
  }

  /**
   * Decode exactly one frame (lazy — invoked when the user settles on a frame,
   * never while scrubbing). Takes the {@link ReplayFrame} WHOLE: `ts`,
   * `node_id`, `link_id` locate the record; `marker` names the source pcap
   * (URL-encoded — names may contain spaces/slashes). Errors: 404 = ts no
   * longer matches the file (capture rebuilt — suggest a timeline reload);
   * 501/502 = tshark missing/failed (detail only, browsing unaffected).
   */
  replayFrameDetail(
    controller: Controller,
    projectId: string,
    tag: number,
    frame: ReplayFrame
  ): Observable<ReplayFrameDetail> {
    return this.httpController.get<ReplayFrameDetail>(
      controller,
      `/projects/${projectId}/markers/tags/${tag}/replay/frame/detail?ts=${frame.ts}&node_id=${frame.node_id}&link_id=${frame.link_id}&marker=${encodeURIComponent(frame.marker)}`
    );
  }

  // ---- Session state -----------------------------------------------------

  readonly tag = signal<number>(-1);
  readonly loadingRange = signal(false);
  readonly rangeError = signal<string | null>(null);
  /** `gate` (409) / `missing` (404) close the overlay; `network` retries inline. */
  readonly rangeErrorKind = signal<RangeErrorKind | null>(null);
  readonly mode = signal<TimelineMode>('frames');
  /** Global frame count from the range response (header display in bucket mode). */
  readonly totalFrames = signal(0);
  readonly buckets = signal<ReplayBucket[]>([]);
  /**
   * The list the tape navigates: the full timeline in `frames` mode, or the
   * currently materialized second in `buckets` mode (empty while on the bucket
   * tape). Server order is authoritative — never re-sorted.
   */
  readonly frames = signal<ReplayFrame[]>([]);
  readonly currentFrameIndex = signal(0);
  readonly currentBucketIndex = signal<number | null>(null);
  /** True while the tape shows frame rows INSIDE a materialized second. */
  readonly inWindow = signal(false);
  readonly materializing = signal(false);
  /** Last settled second legitimately contained no frames (stays on bucket tape). */
  readonly emptySecond = signal(false);
  /** Bookmarked frames in timeline order, session-only. */
  readonly bookmarks = signal<ReplayFrame[]>([]);
  /**
   * SHARED text-search query for every protocol tree (live + pinned windows):
   * typing it once lights up the matches across ALL hops being compared —
   * each tree keeps its own match count and position. Empty string = off.
   */
  readonly searchQuery = signal('');
  readonly detail = signal<DetailState>({ status: 'idle' });
  /**
   * Frames frozen into comparison windows ({@link PINNED_CAP} max, oldest
   * drops). Each entry owns its detail lifecycle so a snapshot survives both
   * cursor moves and detail-cache (LRU) eviction.
   */
  readonly pinnedDetails = signal<PinnedDetail[]>([]);
  private pinSeq = 0;

  readonly currentFrame = computed(() => this.frames()[this.currentFrameIndex()] ?? null);
  /** Whether the tape currently navigates frames (vs. bucket bars). */
  readonly browsingFrames = computed(() => this.mode() === 'frames' || this.inWindow());
  readonly isEmpty = computed(
    () => this.tag() >= 0 && !this.loadingRange() && this.rangeError() === null && this.totalFrames() === 0
  );

  private controller: Controller | null = null;
  private projectId = '';
  private readonly destroy$ = new Subject<void>();
  private readonly detailTrigger$ = new Subject<ReplayFrame | null>();
  private readonly bucketTrigger$ = new Subject<number>();
  private readonly detailCache = new Map<string, ReplayFrameDetail>();
  private readonly materialized = new Map<number, ReplayFrame[]>();
  private pipelinesReady = false;
  private highlightedLinkId: string | null = null;
  /** Bookmark jump waiting for its second to materialize. */
  private pendingJump: ReplayFrame | null = null;
  /** Which end of a freshly materialized window to land on (edge crossing). */
  private pendingLanding: 'start' | 'end' | null = null;

  // ---- Session lifecycle -------------------------------------------------

  /**
   * Open a replay session for one tag: wire the debounced pipelines once, then
   * load the timeline. Call {@link destroy} when the overlay closes.
   */
  start(controller: Controller, projectId: string, tag: number): void {
    this.controller = controller;
    this.projectId = projectId;
    this.tag.set(tag);
    if (!this.pipelinesReady) {
      this.pipelinesReady = true;
      // Detail: fetch only after the frame has been stable for the debounce
      // window — continuous scrubbing keeps resetting it (zero requests while
      // moving); switchMap cancels stale in-flight decodes.
      this.detailTrigger$
        .pipe(
          debounceTime(DETAIL_DEBOUNCE_MS),
          takeUntil(this.destroy$),
          tap((frame) => {
            if (frame) this.detail.set({ status: 'loading' });
          }),
          switchMap((frame) =>
            frame ? this.fetchDetail(frame) : of<DetailState>({ status: 'idle' })
          )
        )
        .subscribe((state) => this.detail.set(state));
      // Bucket materialization: a bucket must stay current before its second
      // is fetched (fast wheeling over the histogram fires nothing).
      this.bucketTrigger$
        .pipe(
          debounceTime(BUCKET_SETTLE_MS),
          takeUntil(this.destroy$),
          switchMap((i) => this.materializeSecond(i))
        )
        .subscribe();
    }
    this.load();
  }

  /**
   * Fetch (or re-fetch, on 404 recovery) the range response and split modes.
   * Branches on `truncated` BEFORE touching `frames` (the key is absent when
   * truncated — a 100k-frame tag must never reach `frames.map`).
   */
  load(): void {
    if (!this.controller || this.tag() < 0) return;
    this.loadingRange.set(true);
    this.rangeError.set(null);
    this.rangeErrorKind.set(null);
    this.clearWindowState();
    this.replayRange(this.controller, this.projectId, this.tag())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (range) => {
          this.loadingRange.set(false);
          this.totalFrames.set(range.frame_count);
          this.materialized.clear();
          if (range.truncated) {
            this.mode.set('buckets');
            this.buckets.set(range.buckets ?? []);
            this.currentBucketIndex.set(0);
            // Settle into the first second straight away so the tape has content.
            this.bucketTrigger$.next(0);
          } else {
            this.mode.set('frames');
            this.frames.set(range.frames ?? []);
            this.currentBucketIndex.set(null);
            this.currentFrameIndex.set(0);
            const first = this.frames()[0];
            if (first) this.detailTrigger$.next(first);
            this.applyHighlight(first?.link_id ?? null);
          }
        },
        error: (err) => {
          this.loadingRange.set(false);
          const message = err.error?.message || err.message || 'Failed to load replay timeline';
          const status = this.errStatus(err);
          const kind: RangeErrorKind =
            status === 409 ? 'gate' : status === 404 ? 'missing' : 'network';
          this.rangeErrorKind.set(kind);
          this.rangeError.set(message);
          this.toaster.error(message);
        },
      });
  }

  /** Tear the session down: cancel pipelines + in-flight work, unlight the link. */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.detailTrigger$.complete();
    this.bucketTrigger$.complete();
    this.clearHighlight();
  }

  // ---- Navigation --------------------------------------------------------

  /** Select a frame by index (clamped). Pokes the debounced detail pipeline. */
  setCurrentIndex(index: number): void {
    const frames = this.frames();
    if (frames.length === 0) return;
    const clamped = Math.max(0, Math.min(frames.length - 1, index));
    if (clamped === this.currentFrameIndex()) return;
    this.currentFrameIndex.set(clamped);
    this.emptySecond.set(false);
    this.detailTrigger$.next(frames[clamped]);
    this.applyHighlight(frames[clamped].link_id);
  }

  /**
   * Step by `delta` frames (frames tape) or buckets (bucket tape). Crossing a
   * materialized window's edge in bucket mode exits to the adjacent bucket —
   * landing on its last frame when moving backwards (closest in time).
   */
  stepBy(delta: number): void {
    if (delta === 0) return;
    if (this.browsingFrames()) {
      const frames = this.frames();
      if (frames.length === 0) return;
      const next = this.currentFrameIndex() + delta;
      if (next >= 0 && next < frames.length) {
        this.setCurrentIndex(next);
        return;
      }
      if (this.mode() === 'frames') {
        this.setCurrentIndex(next < 0 ? 0 : frames.length - 1);
        return;
      }
      // Bucket mode: spilled past the materialized second → adjacent bucket.
      this.pendingLanding = next < 0 ? 'end' : 'start';
      const changed = this.setCurrentBucket((this.currentBucketIndex() ?? 0) + (next < 0 ? -1 : 1));
      if (!changed) this.pendingLanding = null; // clamped at a timeline end — stay put
      return;
    }
    this.setCurrentBucket((this.currentBucketIndex() ?? 0) + delta);
  }

  /**
   * Select a bucket (clamped) and schedule materialization. Existing window
   * state is dropped immediately (the tape falls back to bucket bars until the
   * frames arrive). Returns whether the selection actually changed.
   */
  setCurrentBucket(index: number): boolean {
    const buckets = this.buckets();
    if (buckets.length === 0) return false;
    const clamped = Math.max(0, Math.min(buckets.length - 1, index));
    if (clamped === this.currentBucketIndex() && this.inWindow()) return false;
    this.currentBucketIndex.set(clamped);
    this.inWindow.set(false);
    this.frames.set([]);
    this.currentFrameIndex.set(0);
    this.emptySecond.set(false);
    this.applyHighlight(null);
    this.bucketTrigger$.next(clamped);
    return true;
  }

  // ---- Bookmarks ---------------------------------------------------------

  /** Bookmark/unbookmark the current frame (tuple identity; cap {@link BOOKMARK_CAP}). */
  toggleBookmark(): void {
    const frame = this.currentFrame();
    if (!frame) return;
    const list = this.bookmarks();
    const idx = list.findIndex((b) => sameReplayFrame(b, frame));
    if (idx >= 0) {
      this.bookmarks.set(list.filter((_, k) => k !== idx));
      return;
    }
    const next = [...list, frame];
    if (next.length > BOOKMARK_CAP) next.shift();
    this.bookmarks.set(next);
  }

  isBookmarked(frame: ReplayFrame | null): boolean {
    if (!frame) return false;
    return this.bookmarks().some((b) => sameReplayFrame(b, frame));
  }

  /**
   * Jump to a bookmarked frame. In bucket mode the containing second
   * materializes first, then the exact frame is located inside it.
   */
  jumpToBookmark(frame: ReplayFrame): void {
    if (this.mode() === 'frames') {
      const idx = this.frames().findIndex((f) => sameReplayFrame(f, frame));
      if (idx >= 0) this.setCurrentIndex(idx);
      return;
    }
    const sec = Math.floor(Number(frame.ts));
    const bucketIdx = this.buckets().findIndex((b) => Math.floor(Number(b.ts)) === sec);
    if (bucketIdx < 0) return; // bookmark outside the current histogram (stale)
    if (bucketIdx === this.currentBucketIndex() && this.inWindow()) {
      const idx = this.frames().findIndex((f) => sameReplayFrame(f, frame));
      if (idx >= 0) this.setCurrentIndex(idx);
      return;
    }
    this.pendingJump = frame;
    this.setCurrentBucket(bucketIdx);
  }

  // ---- Pinned comparison windows ------------------------------------------

  /**
   * Freeze the current frame into its own comparison window (no-op if already
   * pinned — tuple identity). The decode goes through the SHARED detail cache:
   * a frame decoded moments ago pins with zero extra requests.
   */
  pinCurrent(): void {
    const frame = this.currentFrame();
    if (!frame) return;
    const list = this.pinnedDetails();
    if (list.some((p) => sameReplayFrame(p.frame, frame))) return;
    const entry: PinnedDetail = { id: ++this.pinSeq, frame, state: { status: 'loading' } };
    const next = [...list, entry];
    if (next.length > PINNED_CAP) {
      next.shift();
      this.toaster.warning('Pin limit reached — unpinned the oldest frame.');
    }
    this.pinnedDetails.set(next);
    this.fetchDetail(frame)
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => this.updatePinState(entry.id, state));
  }

  /** Drop a pinned window. */
  unpin(id: number): void {
    this.pinnedDetails.set(this.pinnedDetails().filter((p) => p.id !== id));
    this.pinRects.delete(id);
  }

  // ---- pinned-window rect registry (snapping + dock/cluster placement) ------

  /** Structural rect plus where the window sits — satisfies geometry's Rect. */
  private readonly pinRects = new Map<
    number,
    { left: number; top: number; width: number; height: number; docked: boolean }
  >();

  /**
   * Bumped ONLY when a window's docked flag flips (dragged out of the row /
   * re-docked / first report). The dock row re-indexes (docked-only slots) and
   * new-pin cluster joins depend on it; pure rect moves happen inside every
   * reposition pass and must NOT retrigger anything.
   */
  readonly dockVersion = signal(0);

  /**
   * A pinned window reports its settled rect and whether it sits in the dock
   * row or was hand-arranged (dragged/resized out) — feeding both magnetic
   * snapping and the dock-row/cluster placement decisions. Plain Map on
   * purpose: read synchronously inside drag mousemoves, no signal churn.
   */
  reportPinRect(
    id: number,
    rect: { left: number; top: number; width: number; height: number },
    docked: boolean
  ): void {
    const prev = this.pinRects.get(id);
    this.pinRects.set(id, { ...rect, docked });
    if (prev?.docked !== docked) this.dockVersion.update((v) => v + 1);
  }

  /** Settled sibling rects for snapping — everyone except the dragged window. */
  pinSiblingRects(exceptId: number): { left: number; top: number; width: number; height: number }[] {
    const out: { left: number; top: number; width: number; height: number }[] = [];
    for (const [id, r] of this.pinRects) {
      if (id !== exceptId) out.push({ left: r.left, top: r.top, width: r.width, height: r.height });
    }
    return out;
  }

  /** Hand-arranged (freed) rects in pin order — a NEW pin joins beside them. */
  freedPinRects(): { left: number; top: number; width: number; height: number }[] {
    return this.pinnedDetails()
      .map((p) => this.pinRects.get(p.id))
      .filter((r): r is NonNullable<typeof r> => !!r && !r.docked)
      .map(({ left, top, width, height }) => ({ left, top, width, height }));
  }

  /** Ids sitting in the dock row, pin order (slot indexing; unreported = docked). */
  dockedPinIds(): number[] {
    return this.pinnedDetails()
      .filter((p) => this.pinRects.get(p.id)?.docked !== false)
      .map((p) => p.id);
  }

  /** The user's preferred window size from their last manual resize (session-only). */
  private lastUserSize: { width: number; height: number } | null = null;

  /**
   * Any manual resize updates the session's preferred size: subsequently
   * pinned windows dock at that size instead of the default tile — resize
   * once to something comfortable, every later 📌 matches.
   */
  rememberWindowSize(width: number, height: number): void {
    this.lastUserSize = { width, height };
  }

  /** Preferred dock tile size, or null while no manual resize happened. */
  userWindowSize(): { width: number; height: number } | null {
    return this.lastUserSize;
  }

  /** Retry a pinned window's failed decode. */
  retryPin(id: number): void {
    const pin = this.pinnedDetails().find((p) => p.id === id);
    if (!pin || pin.state.status === 'ok') return;
    this.updatePinState(id, { status: 'loading' });
    this.fetchDetail(pin.frame)
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => this.updatePinState(id, state));
  }

  private updatePinState(id: number, state: DetailState): void {
    this.pinnedDetails.update((list) => list.map((p) => (p.id === id ? { ...p, state } : p)));
  }

  // ---- Detail ------------------------------------------------------------

  /** Retry the failed (or re-open the current) frame decode. */
  retryDetail(): void {
    const state = this.detail();
    const frame = state.status === 'error' ? state.frame : this.currentFrame();
    if (frame) this.detailTrigger$.next(frame);
  }

  /** Re-run the range request (404 recovery after a capture was rebuilt). */
  reloadTimeline(): void {
    this.load();
  }

  // ---- Link highlight ----------------------------------------------------

  /** Clear the persistent highlight (overlay close / project switch). */
  clearHighlight(): void {
    this.applyHighlight(null);
  }

  private applyHighlight(newId: string | null): void {
    if (newId === this.highlightedLinkId) return;
    this.setLinkClass(this.highlightedLinkId, false);
    this.highlightedLinkId = newId;
    this.setLinkClass(newId, true);
  }

  /** Toggle the persistent class on the link's path (empty d3 selections no-op). */
  private setLinkClass(linkId: string | null, on: boolean): void {
    if (!linkId) return;
    select('svg#map')
      .select<SVGGElement>(`g.link[link_id="${linkId}"]`)
      .select('path.ethernet_link, path.serial_link')
      .classed(LINK_HIGHLIGHT_CLASS, on);
  }

  // ---- Internals ---------------------------------------------------------

  /** HTTP status off a ControllerError (wrapped) or raw HttpErrorResponse. */
  private errStatus(err: any): number | undefined {
    return err?.originalError?.status ?? err?.status;
  }

  private clearWindowState(): void {
    this.frames.set([]);
    this.buckets.set([]);
    this.inWindow.set(false);
    this.currentFrameIndex.set(0);
    this.currentBucketIndex.set(null);
    this.emptySecond.set(false);
    this.pendingJump = null;
    this.pendingLanding = null;
    this.detail.set({ status: 'idle' });
  }

  private fetchDetail(frame: ReplayFrame): Observable<DetailState> {
    const key = detailKey(frame);
    const cached = this.detailCache.get(key);
    if (cached) {
      // Refresh LRU recency.
      this.detailCache.delete(key);
      this.detailCache.set(key, cached);
      return of({ status: 'ok', detail: cached });
    }
    if (!this.controller) return of<DetailState>({ status: 'idle' });
    return this.replayFrameDetail(this.controller, this.projectId, this.tag(), frame).pipe(
      map((detail) => {
        this.detailCache.set(key, detail);
        while (this.detailCache.size > DETAIL_CACHE_CAP) {
          const oldest = this.detailCache.keys().next().value;
          if (oldest === undefined) break;
          this.detailCache.delete(oldest);
        }
        return { status: 'ok', detail } as DetailState;
      }),
      catchError((err) => {
        const status = this.errStatus(err);
        const kind = status === 501 || status === 502 ? 'unavailable' : status === 404 ? 'missing' : 'network';
        const message = err.error?.message || err.message || 'Failed to decode frame';
        return of({ status: 'error', kind, message, frame } as DetailState);
      })
    );
  }

  /**
   * Materialize bucket `i`'s second: fetch its frames (`ts` VERBATIM from the
   * bucket), cache for instant revisit, and enter the frame tape. Cached and
   * empty results never hit the network.
   */
  private materializeSecond(i: number): Observable<null> {
    const bucket = this.buckets()[i];
    if (!bucket || this.mode() !== 'buckets' || !this.controller) return of(null);
    const cached = this.materialized.get(i);
    if (cached) {
      this.enterWindow(cached);
      return of(null);
    }
    this.materializing.set(true);
    return this.replayFrames(this.controller, this.projectId, this.tag(), bucket.ts).pipe(
      map((res) => res.frames),
      catchError((err) => {
        // Window fetch failed (gate race / network): stay on the bucket tape.
        const message = err.error?.message || err.message || 'Failed to load frames for this second';
        this.toaster.error(message);
        this.materializing.set(false);
        return of(null);
      }),
      tap((frames) => {
        this.materializing.set(false);
        if (frames === null) return;
        this.materialized.set(i, frames);
        while (this.materialized.size > MATERIALIZED_CAP) {
          const oldest = this.materialized.keys().next().value;
          if (oldest === undefined) break;
          this.materialized.delete(oldest);
        }
        if (frames.length === 0) {
          this.emptySecond.set(true);
          return;
        }
        this.enterWindow(frames);
      }),
      map(() => null)
    );
  }

  /** Switch the tape to frame rows inside a materialized second. */
  private enterWindow(frames: ReplayFrame[]): void {
    this.frames.set(frames);
    this.inWindow.set(true);
    const landing = this.pendingLanding ?? 'start';
    this.pendingLanding = null;
    let index = landing === 'end' ? frames.length - 1 : 0;
    const jump = this.pendingJump;
    this.pendingJump = null;
    if (jump) {
      const found = frames.findIndex((f) => sameReplayFrame(f, jump));
      if (found >= 0) index = found;
    }
    index = Math.max(0, index);
    this.currentFrameIndex.set(index);
    this.detailTrigger$.next(frames[index]);
    this.applyHighlight(frames[index].link_id);
  }
}
