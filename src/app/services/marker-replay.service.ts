import { Injectable, computed, signal } from '@angular/core';
import { Subject, Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { select } from 'd3-selection';
import { Controller } from '@models/controller';
import {
  DetailState,
  PinnedDetail,
  ReplayFrame,
  ReplayFrameDetail,
  ReplayRangeResponse,
  ReplaySource,
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

/** How long the index must be stable before the detail (sharkd) request fires. */
export const DETAIL_DEBOUNCE_MS = 200;
const DETAIL_CACHE_CAP = 50;
/** Max frozen comparison windows per session; the oldest pin drops past it. */
const PINNED_CAP = 8;
/** Persistent CSS class on the current frame's link path (styled in styles.scss). */
const LINK_HIGHLIGHT_CLASS = 'marker-replay-active';
/** Server-side cap on display-filter length — mirror it client-side. */
const FILTER_MAX_CHARS = 2000;

/**
 * Why the range fetch failed. `gate`/`missing` close the window;
 * `network` retries inline; `unavailable` (501 — sharkd missing) shows a
 * full-window notice; `filter` (400 — bad display filter) stays INLINE in
 * the filter bar and keeps the last good list rendered.
 */
export type RangeErrorKind = 'gate' | 'missing' | 'network' | 'unavailable' | 'filter';

/**
 * REST client + session state for marker tag aggregated replay — the engine
 * under the Wireshark-style packet list + detail window.
 *
 * Component-scoped (provided by the replay window, dies with it — every cache
 * and signal below is per-session by construction). Two deliberately separated
 * performance regimes mirror the server contract:
 *  - **List browsing** — ONE `range` call: the FULL merged frame list (no
 *    server cap — the client windows the rendering), optionally narrowed by a
 *    server-side display filter (Wireshark display-filter semantics — the
 *    field values live in the decodes, so filtering can ONLY happen
 *    server-side).
 *  - **Frame detail** — one sharkd decode per frame the user settles on,
 *    debounced ({@link DETAIL_DEBOUNCE_MS}) so quick list clicks issue zero
 *    requests; stale in-flight requests are cancelled (switchMap).
 *
 * Contract red lines enforced here:
 *  - `ts` round-trips VERBATIM — frames are navigated by ARRAY INDEX (server
 *    order is authoritative, never re-sorted), frame objects travel whole, and
 *    the only `Number(ts)` uses live in replay-timeline-math.ts (display).
 */
@Injectable()
export class MarkerReplayService {
  constructor(
    private httpController: HttpController,
    private toaster: ToasterService
  ) {}

  // ---- HTTP --------------------------------------------------------------

  /**
   * List metadata + the FULL merged frame list — the server applies NO cap
   * (`frame_count` == `frames.length`). `start`/`end` are null when nothing
   * was captured. `filter` (display-filter expression) narrows the whole
   * response server-side — count and list recompute over the matching frames
   * only. `link` (capture-source link id) narrows the same way and combines
   * with `filter` (AND); `sources` in the response always lists EVERY source
   * of the tag so the link picker keeps its options.
   */
  replayRange(
    controller: Controller,
    projectId: string,
    tag: number,
    filter?: string,
    link?: string
  ): Observable<ReplayRangeResponse> {
    const qs = [
      filter ? `filter=${encodeURIComponent(filter)}` : null,
      link ? `link=${encodeURIComponent(link)}` : null,
    ]
      .filter((p): p is string => !!p)
      .join('&');
    return this.httpController.get<ReplayRangeResponse>(
      controller,
      `/projects/${projectId}/markers/tags/${tag}/replay/range${qs ? `?${qs}` : ''}`
    );
  }

  /**
   * Decode exactly one frame (lazy — invoked when the user settles on a frame,
   * never while scrubbing). Takes the {@link ReplayFrame} WHOLE: `ts`,
   * `node_id`, `link_id` locate the record; `marker` names the source pcap
   * (URL-encoded — names may contain spaces/slashes). Errors: 404 = ts no
   * longer matches the file (capture rebuilt — suggest a timeline reload);
   * 501/502 = sharkd missing/failed.
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
  /** `gate` (409) / `missing` (404) close the window; see {@link RangeErrorKind}. */
  readonly rangeErrorKind = signal<RangeErrorKind | null>(null);
  /** Draft text in the filter bar (kept editable after a 400 so it can be fixed). */
  readonly filter = signal('');
  /**
   * The filter the CURRENT list was loaded with — only ever set on HTTP
   * success, so a rejected filter leaves both it and the rendered data alone.
   */
  readonly appliedFilter = signal('');
  /**
   * The capture-source link the current list is narrowed to (link id), null =
   * every link. Same success-only discipline as {@link appliedFilter}; an
   * unknown link is NOT an error — the server answers 200 with an empty set,
   * like a zero-hit display filter.
   */
  readonly appliedLink = signal<string | null>(null);
  /** Inline filter-bar error (400 syntax / over-length); null when healthy. */
  readonly filterError = signal<string | null>(null);
  /**
   * Per-source stats from the last range response — the link picker's option
   * list. Multiple markers on one link arrive as several entries; the UI
   * groups them by link id.
   */
  readonly sources = signal<ReplaySource[]>([]);
  /**
   * Frame count of the CURRENT (possibly filtered) range response — == the
   * rendered list's length (the server sends the FULL list, no cap). Drives
   * "matched" in the header and the empty-filtered state.
   */
  readonly totalFrames = signal(0);
  /** Unfiltered total, captured on every unfiltered load — "of N" in the header. */
  readonly totalUnfiltered = signal(0);
  /**
   * The list the packet list navigates — the FULL merged timeline (the server
   * never caps it; the client windows the rendering). Server order is
   * authoritative — never re-sorted.
   */
  readonly frames = signal<ReplayFrame[]>([]);
  readonly currentFrameIndex = signal(0);
  /**
   * SHARED text-search query for every protocol tree (live + pinned windows):
   * typing it once lights up the matches across ALL hops being compared —
   * each tree keeps its own match count and position. Empty string = off.
   */
  readonly searchQuery = signal('');
  readonly detail = signal<DetailState>({ status: 'idle' });
  /**
   * The last SUCCESSFUL live decode — lets the detail pane keep the previous
   * tree rendered (dimmed) while the next frame decodes, instead of flashing
   * the loading spinner on every list click. Null until the first decode.
   */
  readonly lastOkDetail = signal<ReplayFrameDetail | null>(null);
  /**
   * Frames frozen into comparison windows ({@link PINNED_CAP} max, oldest
   * drops). Each entry owns its detail lifecycle so a snapshot survives both
   * cursor moves and detail-cache (LRU) eviction.
   */
  readonly pinnedDetails = signal<PinnedDetail[]>([]);
  private pinSeq = 0;

  readonly currentFrame = computed(() => this.frames()[this.currentFrameIndex()] ?? null);
  readonly isEmpty = computed(
    () => this.tag() >= 0 && !this.loadingRange() && this.rangeError() === null && this.totalFrames() === 0
  );

  private controller: Controller | null = null;
  private projectId = '';
  private readonly destroy$ = new Subject<void>();
  private readonly detailTrigger$ = new Subject<ReplayFrame | null>();
  private readonly detailCache = new Map<string, ReplayFrameDetail>();
  private pipelinesReady = false;
  private highlightedLinkId: string | null = null;
  /**
   * Bumped on every load() START. A newer load does not unsubscribe an older
   * in-flight range response, so each response carries its epoch and applies
   * only while still the newest — otherwise a slow older reply (heavy display
   * filter) would overwrite the list a quicker newer load (clear/link pick)
   * had already rendered.
   */
  private loadEpoch = 0;

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
        .subscribe((state) => {
          this.detail.set(state);
          // Remember the last successful decode — the pane keeps its tree
          // rendered (dimmed) while the next one is in flight instead of
          // flashing through a loading spinner on every row click.
          if (state.status === 'ok') this.lastOkDetail.set(state.detail);
        });
    }
    this.load('');
  }

  /**
   * Fetch the range response for `candidateFilter` (+ `candidateLink`) and
   * swap the list. The OLD list stays rendered (dimmed by the host) until the
   * response lands — a rejected filter (400) therefore keeps the last good
   * data on screen.
   */
  private load(candidateFilter: string, candidateLink: string | null = null): void {
    if (!this.controller || this.tag() < 0) return;
    const epoch = ++this.loadEpoch;
    this.loadingRange.set(true);
    this.rangeError.set(null);
    this.rangeErrorKind.set(null);
    this.filterError.set(null);
    this.replayRange(this.controller, this.projectId, this.tag(), candidateFilter || undefined, candidateLink || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (range) => {
          if (epoch !== this.loadEpoch) return; // superseded by a newer load
          this.loadingRange.set(false);
          this.appliedFilter.set(candidateFilter);
          this.appliedLink.set(candidateLink);
          this.sources.set(range.sources ?? []);
          this.totalFrames.set(range.frame_count);
          if (!candidateFilter && !candidateLink) {
            this.totalUnfiltered.set(range.frame_count);
          } else if (!candidateFilter && candidateLink) {
            // Link-only load: `sources` always carries the FULL inventory (the
            // picker contract), so its summed counts keep "of N"/"All links (N)"
            // fresh even though frame_count is the narrowed total.
            const total = (range.sources ?? []).reduce((sum, s) => sum + s.count, 0);
            if (total > 0) this.totalUnfiltered.set(total);
          }
          this.clearWindowState();
          this.frames.set(range.frames ?? []);
          this.currentFrameIndex.set(0);
          const first = this.frames()[0];
          if (first) this.detailTrigger$.next(first);
          this.applyHighlight(first?.link_id ?? null);
        },
        error: (err) => {
          if (epoch !== this.loadEpoch) return; // superseded — the newer load owns the state
          this.loadingRange.set(false);
          const message = err.error?.message || err.message || 'Failed to load replay timeline';
          const status = this.errStatus(err);
          const sentFilter = !!candidateFilter;
          const kind: RangeErrorKind =
            status === 409
              ? 'gate'
              : status === 404
                ? 'missing'
                : status === 501
                  ? 'unavailable'
                  : status === 400 && sentFilter
                    ? 'filter'
                    : 'network';
          if (kind === 'filter') {
            // User-input error: inline in the filter bar, data untouched, no toast.
            this.filterError.set(message);
            return;
          }
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
    this.clearHighlight();
  }

  // ---- Navigation --------------------------------------------------------

  /**
   * Select a frame by index (clamped). Pokes the debounced detail pipeline.
   * Returns whether the selection actually moved (same-index/empty-list are
   * no-ops) — callers that follow the selection (focus, scroll) key off it.
   */
  setCurrentIndex(index: number): boolean {
    const frames = this.frames();
    if (frames.length === 0) return false;
    const clamped = Math.max(0, Math.min(frames.length - 1, index));
    if (clamped === this.currentFrameIndex()) return false;
    this.currentFrameIndex.set(clamped);
    this.detailTrigger$.next(frames[clamped]);
    this.applyHighlight(frames[clamped].link_id);
    return true;
  }

  // ---- Display filter ------------------------------------------------------

  /**
   * Apply a display filter (Wireshark-style): the SERVER evaluates it against
   * the decodes and recomputes counts/slices/buckets. The draft is kept on
   * rejection so the user can fix it; over-length is rejected client-side
   * without a request. Keeps the applied LINK pick — the two narrowings
   * combine (AND).
   */
  applyFilter(raw: string): void {
    const text = raw.trim();
    this.filter.set(text);
    if (text.length > FILTER_MAX_CHARS) {
      this.filterError.set(`Filter is longer than ${FILTER_MAX_CHARS} characters`);
      return;
    }
    // Unchanged input is a no-op (same guard as applyLinkFilter): a repeat
    // Enter must not re-run the server evaluation for a byte-identical list.
    if (text === this.appliedFilter()) return;
    this.load(text, this.appliedLink());
  }

  /**
   * Narrow the list to one capture link (server-side, like the display
   * filter — count and list recompute over that link's frames only).
   * Re-clicking the link already in effect clears it (chip toggle).
   */
  applyLinkFilter(linkId: string | null): void {
    const next = linkId && linkId === this.appliedLink() ? null : linkId;
    if (next === this.appliedLink()) return;
    this.load(this.appliedFilter(), next);
  }

  /** Drop the display filter (the link pick stays) and reload. */
  clearFilter(): void {
    this.filter.set('');
    // Nothing applied — the draft alone never narrowed the list, no reload.
    if (this.appliedFilter() === '') return;
    this.load('', this.appliedLink());
  }

  /** Empty-result recovery: drop BOTH the display filter and the link pick. */
  clearAllFilters(): void {
    this.filter.set('');
    this.load('', null);
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
    const entry: PinnedDetail = {
      id: ++this.pinSeq,
      frame,
      listStartTs: this.frames()[0]?.ts ?? frame.ts,
      state: { status: 'loading' },
    };
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

  /** Re-run the range request with the CURRENT filter/link (404 recovery, Retry). */
  reloadTimeline(): void {
    this.load(this.appliedFilter(), this.appliedLink());
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
    this.currentFrameIndex.set(0);
    this.detail.set({ status: 'idle' });
    this.lastOkDetail.set(null);
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
}
