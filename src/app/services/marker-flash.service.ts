import { Injectable, signal, effect, EffectRef, DestroyRef, inject } from '@angular/core';
import { select, Selection } from 'd3-selection';

/** Resolved visual state for one flashing link. */
interface FlashState {
  /** Marker color (hex) or null ⇒ default theme color. */
  color: string | null;
  /** Traffic direction relative to the capture node, or null ⇒ no arrow. */
  dir: 'tx' | 'rx' | null;
  /** Capture-side node id (the link endpoint `dir` is relative to). */
  captureNodeId: string | null;
  /** Monotonic counter so we can pick the most-recent entry when multiple
   *  directions are active on the same link — excluded from sameFlash() diff. */
  _seq: number;
}

/** Filled triangle pointing +x with its centroid at the origin; rotated to the flow. */
const ARROW_PATH = 'M -4 -6 L 8 0 L -4 6 Z';
/** Target spacing (px) between arrows along the path — drives how many are drawn. */
const ARROW_SPACING = 55;
const MIN_ARROW_COUNT = 3;
const MAX_ARROW_COUNT = 8;
/** Distance (in path length) either side of an arrow used to estimate the local tangent. */
const ARROW_TANGENT_EPS = 6;

/**
 * Composite-key helpers.  Entries are keyed by `linkId` + direction so that
 * tx and rx slots on the same link live independently (independent expiry, same-direction renewal).
 * A null byte separates the two parts; linkIds are UUIDs so the separator is safe.
 */
const SEP = '\x00';
const compKey = (linkId: string, dir: 'tx' | 'rx' | null) => `${linkId}${SEP}${dir ?? 'none'}`;
const linkIdOf = (key: string) => key.split(SEP)[0];

/** Module-level monotonic counter for ordering entries on the same link. */
let _seq = 0;

/**
 * Flashes a link when its marker matches live traffic, and — when the match
 * carries a direction (`dir`) — draws evenly-spaced arrows along the link
 * pointing toward the traffic receiver.
 *
 * State is a signal of composite-key → FlashState.  `flash(...)` only stages
 * the (linkId, dir) slot into a per-frame buffer (last-write-wins); a
 * requestAnimationFrame flush applies the whole frame's changes in ONE signal
 * update and renews each slot's timer once (same-direction renewal, cross-direction expiry).
 * This decouples cost from the marker.match rate — N thousand matches/sec still
 * process at ~60 flushes/sec.
 *
 * An `effect()` diffs the new map against the previous one and mutates ONLY the
 * changed link's DOM.  When a slot expires but another direction is still active
 * on the same link, the DOM falls back to the other direction automatically.
 *
 * Color comes from the caller (resolved as `marker.color ?? null`). `null` means
 * "use the default theme color" (handled in CSS).
 * `durationMs` comes from the marker's `highlight_duration` (`null` ⇒ UI default).
 * `dir` is `null`/absent for old uBridge builds → pulse without an arrow.
 */
@Injectable()
export class MarkerFlashService {
  /** composite-key → flash state. */
  private readonly _flashing = signal<ReadonlyMap<string, FlashState>>(new Map());
  /** Per-slot debounce timers. */
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** UI default highlight duration when a marker has no `highlight_duration`. */
  private readonly DEFAULT_FLASH_MS = 800;
  private readonly effectRef: EffectRef;
  /** Previous snapshot for diffing (composite-key → state). */
  private prev = new Map<string, FlashState>();
  /**
   * Per-link path-geometry cache. getTotalLength()/getPointAtLength() are sync
   * reflows whose cost scales with the WHOLE SVG (tens of thousands of elements
   * on large topologies). Keyed by linkId and invalidated when the path's `d`
   * attribute changes (node dragged / link redrawn), so repeated flashes of an
   * unchanged link skip geometry queries entirely → no reflow per flash.
   */
  private readonly geoCache = new Map<
    string,
    { d: string; len: number; pts: Map<number, { x: number; y: number } | null> }
  >();
  /**
   * Per-frame batching buffer (composite-key → {state, ms}). `flash()` stages
   * here (last-write-wins, O(1)) and schedules a single rAF flush; the flush
   * applies all of the frame's changes in ONE signal update and renews timers
   * once per key. This decouples cost from the marker.match rate — 25k
   * matches/sec still → ~60 flushes/sec — and collapses repeated matches on the
   * same (linkId,dir) within a frame to one entry.
   */
  private pending = new Map<string, { state: FlashState; ms: number }>();
  /** Pending requestAnimationFrame id for the batch flush. */
  private flushRaf: number | null = null;
  /** Whether a flush is already scheduled (guard independent of the rAF id). */
  private flushScheduled = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.effectRef = effect(() => this.applyDiff(this._flashing()));
    destroyRef.onDestroy(() => {
      if (this.flushRaf !== null) {
        cancelAnimationFrame(this.flushRaf);
        this.flushRaf = null;
      }
      this.flushScheduled = false;
      this.pending.clear();
      this.effectRef.destroy();
      for (const key of [...this.prev.keys()]) this.clearLink(linkIdOf(key));
      this.prev.clear();
      for (const t of this.timers.values()) clearTimeout(t);
      this.timers.clear();
      this.geoCache.clear();
    });
  }

  /**
   * Flash a link. Repeated calls with the same direction within the duration
   * window keep that direction lit.  Calls with a *different* direction
   * start an independent timer — the old direction stays active until its own
   * timer expires.
   *
   * @param color resolved marker color (hex), or null to use the default theme color.
   * @param durationMs how long to stay lit after the last match
   *   (`marker.highlight_duration`, or null for the UI default).
   * @param dir traffic direction relative to `captureNodeId` (`"tx"` | `"rx"` | null).
   *   Null/absent (old uBridge) ⇒ pulse without an arrow.
   * @param captureNodeId the link endpoint `dir` is relative to (orients the arrow).
   */
  flash(
    linkId: string,
    color: string | null,
    durationMs?: number | null,
    dir: 'tx' | 'rx' | null = null,
    captureNodeId: string | null = null
  ) {
    const key = compKey(linkId, dir);
    const ms = durationMs && durationMs > 0 ? durationMs : this.DEFAULT_FLASH_MS;
    // Stage in the per-frame buffer (last-write-wins per key) and schedule a
    // single flush. Avoids a full Map copy + signal update + effect per match;
    // cost is decoupled from the marker.match rate.
    this.pending.set(key, { state: { color, dir, captureNodeId, _seq: _seq++ }, ms });
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    this.flushRaf = requestAnimationFrame(() => {
      this.flushScheduled = false;
      this.flushRaf = null;
      this.flush();
    });
  }

  /**
   * Apply one frame's worth of staged flashes in a single signal update and
   * renew each affected slot's timer once. Same (linkId,dir) repeated within the
   * frame already collapsed to one entry in `pending`; here we additionally skip
   * the signal update entirely when no staged state actually differs from the
   * current one (so steady repeated matches cost only timer renewals).
   */
  private flush() {
    if (this.pending.size === 0) return;
    const updates = this.pending;
    this.pending = new Map();
    // Renew each slot's timer once per frame.
    for (const [key, { ms }] of updates) {
      clearTimeout(this.timers.get(key));
      this.timers.set(key, setTimeout(() => this.expire(key), ms));
    }
    // Apply state changes in ONE Map copy; if nothing actually changed, return
    // the same ref so the signal does not fire and the effect does not run.
    this._flashing.update((m) => {
      let next: Map<string, FlashState> | null = null;
      for (const [key, { state }] of updates) {
        const cur = m.get(key);
        if (
          !cur ||
          cur.color !== state.color ||
          cur.dir !== state.dir ||
          cur.captureNodeId !== state.captureNodeId
        ) {
          if (next === null) next = new Map(m);
          next.set(key, state);
        }
      }
      return next ?? m;
    });
  }

  private expire(key: string) {
    this.timers.delete(key);
    this._flashing.update((m) => {
      if (!m.has(key)) return m;
      const next = new Map(m);
      next.delete(key);
      return next;
    });
  }

  /** Diff old vs new and touch only changed links. */
  private applyDiff(curr: ReadonlyMap<string, FlashState>) {
    // Removed → clear or fall back to another active direction on the same link.
    for (const key of [...this.prev.keys()]) {
      if (!curr.has(key)) {
        const lid = linkIdOf(key);
        this.prev.delete(key);
        const best = this.bestEntryForLink(curr, lid);
        if (best) {
          this.setLink(lid, best.state);
          this.prev.set(best.key, best.state);
        } else {
          this.clearLink(lid);
        }
      }
    }
    // Added or changed → set.
    for (const [key, state] of curr) {
      const prevState = this.prev.get(key);
      if (
        !prevState ||
        prevState.color !== state.color ||
        prevState.dir !== state.dir ||
        prevState.captureNodeId !== state.captureNodeId
      ) {
        this.setLink(linkIdOf(key), state);
        this.prev.set(key, state);
      }
    }
  }

  /** Among entries for the same linkId, pick the one with the highest _seq. */
  private bestEntryForLink(
    map: ReadonlyMap<string, FlashState>,
    linkId: string
  ): { key: string; state: FlashState } | null {
    let result: { key: string; state: FlashState } | null = null;
    for (const [k, s] of map) {
      if (linkIdOf(k) === linkId && (!result || s._seq > result.state._seq)) {
        result = { key: k, state: s };
      }
    }
    return result;
  }

  private setLink(id: string, state: FlashState) {
    const group = this.selectLinkGroup(id);
    if (group.empty()) return;
    const path = group.select<SVGPathElement>('path.ethernet_link, path.serial_link');
    if (path.empty()) return;
    path.classed('marker-pulse', true);
    // null → remove inline color so CSS default (var(--mat-sys-primary)) applies.
    path.style('stroke', state.color ?? null);
    const slot = state.dir === 'tx' ? 'tx' : state.dir === 'rx' ? 'rx' : null;
    this.renderDirArrow(id, group, path, state, slot);
  }

  private clearLink(id: string) {
    const group = this.selectLinkGroup(id);
    if (group.empty()) return;
    group
      .select('path.ethernet_link, path.serial_link')
      .classed('marker-pulse', false)
      .style('stroke', null);
    // Remove ALL direction arrows (both tx and rx slots).
    group.selectAll('g.marker-arrow-tx, g.marker-arrow-rx').remove();
    // geoCache deliberately NOT deleted here: link geometry hasn't changed, and
    // the next flash would re-trigger getTotalLength()/getPointAtLength() sync
    // reflows on the whole SVG (~10k elements on a 1000-node topology).  The
    // cache self-invalidates when the path's "d" attribute changes (node drag /
    // link redraw), so persisting it across flash cycles is safe.
  }

  private selectLinkGroup(id: string) {
    return select('svg#map').select<SVGGElement>(`g.link[link_id="${id}"]`);
  }

  /**
   * Whether the arrow points along the path's source→target direction. The path
   * is always drawn source→target, and `dir` is relative to the capture node, so
   * the arrow follows the path only when the capture node sits at the sending end
   * of a `tx` flow (capture→peer) or the receiving end of an `rx` flow (peer→capture).
   * Pure — unit-tested directly (the geometry side can't run under jsdom).
   */
  private static arrowPointsAlongPath(
    dir: 'tx' | 'rx',
    captureIsSource: boolean,
    captureIsTarget: boolean
  ): boolean {
    return (dir === 'tx' && captureIsSource) || (dir === 'rx' && captureIsTarget);
  }

  /**
   * Draw evenly-spaced direction arrows along the link into a direction-specific
   * container (`g.marker-arrow-tx` / `marker-arrow-rx`). Each slot is managed
   * independently so tx and rx arrows can coexist without wiping each other out.
   *
   * The path is always drawn source→target, so we read `map-source`/`map-target`
   * off the link group to learn which end the capture node is, then orient all
   * arrows along or against the path. Skips when `dir` is null, or when the
   * capture node can't be matched to an endpoint.
   */
  private renderDirArrow(
    linkId: string,
    group: Selection<SVGGElement, any, any, any>,
    path: Selection<SVGPathElement, any, any, any>,
    state: FlashState,
    slot: 'tx' | 'rx' | null
  ) {
    // Only remove OUR slot's container — leave the other direction's arrows alone.
    const slotClass = slot ? `marker-arrow-${slot}` : 'marker-arrow';
    group.select(`g.${slotClass}`).remove();
    if (!slot) return; // legacy (no dir) → pulse only, no arrows.

    const sourceId = group.attr('map-source');
    const targetId = group.attr('map-target');
    const captureIsSource = !!state.captureNodeId && state.captureNodeId === sourceId;
    const captureIsTarget = !!state.captureNodeId && state.captureNodeId === targetId;
    if (!captureIsSource && !captureIsTarget) return;

    const node = path.node();
    if (!node) return;
    // Cache geometry by the path's `d`: getTotalLength() is a sync reflow whose
    // cost scales with the whole SVG, so reuse it while the link geometry is
    // stable (the common case during a marker flood). When `d` changes (node
    // dragged / link redrawn) the key mismatches and we recompute. jsdom (unit
    // tests) doesn't implement path geometry → bail out quietly there.
    const d = node.getAttribute('d') ?? '';
    let entry = this.geoCache.get(linkId);
    if (!entry || entry.d !== d) {
      let len: number;
      try {
        len = node.getTotalLength();
      } catch {
        return;
      }
      if (!len || !Number.isFinite(len)) return;
      entry = { d, len, pts: new Map() };
      this.geoCache.set(linkId, entry);
    }
    const len = entry.len;

    // Pre-compute the direction offset once for all arrows along this link.
    const angleOffset = MarkerFlashService.arrowPointsAlongPath(state.dir, captureIsSource, captureIsTarget)
      ? 0
      : Math.PI;

    // Place evenly-spaced arrows along the path. When both tx and rx are active
    // simultaneously, stagger rx arrows by half a step so they don't overlap.
    const count = Math.max(MIN_ARROW_COUNT, Math.min(MAX_ARROW_COUNT, Math.round(len / ARROW_SPACING)));
    const container = group.append<SVGGElement>('g').attr('class', slotClass);
    const step = len / (count + 1);

    for (let i = 0; i < count; i++) {
      let at = step * (i + 1);
      if (slot === 'rx') at += step * 0.5;
      const behind = this.getCachedPt(entry, node, Math.max(0, at - ARROW_TANGENT_EPS));
      const ahead = this.getCachedPt(entry, node, Math.min(len, at + ARROW_TANGENT_EPS));
      const pos = this.getCachedPt(entry, node, at);
      if (!behind || !ahead || !pos) continue;

      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) + angleOffset;
      container
        .append<SVGPathElement>('path')
        .attr('d', ARROW_PATH)
        .attr('transform', `translate(${pos.x},${pos.y}) rotate(${(angle * 180) / Math.PI})`)
        // null → CSS default (var(--mat-sys-primary)); hex → match the pulse color.
        .style('fill', state.color ?? null);
    }
  }

  /**
   * Cached getPointAtLength. Like getTotalLength(), each call is a sync reflow
   * that scales with the whole SVG, so reuse the result for a stable path.
   * `at` is rounded to 0.01px for the key (positions are deterministic from the
   * cached length, so identical across flashes of the same geometry).
   */
  private getCachedPt(
    entry: { pts: Map<number, { x: number; y: number } | null> },
    node: SVGPathElement,
    at: number
  ): { x: number; y: number } | null {
    const key = Math.round(at * 100);
    const cached = entry.pts.get(key);
    if (cached !== undefined) return cached;
    const pt = this.pointAt(node, at);
    entry.pts.set(key, pt);
    return pt;
  }

  /** Safe getPointAtLength wrapper (jsdom throws / returns non-finite values). */
  private pointAt(node: SVGPathElement, at: number): { x: number; y: number } | null {
    try {
      const p = node.getPointAtLength(at);
      return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null;
    } catch {
      return null;
    }
  }
}
