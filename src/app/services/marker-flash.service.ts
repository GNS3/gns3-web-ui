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
 * tx and rx slots on the same link live independently (独立过期, 同方向续命).
 * A null byte separates the two parts; linkIds are UUIDs so the separator is safe.
 */
const SEP = '\x00';
const compKey = (linkId: string, dir: 'tx' | 'rx' | null) => `${linkId}${SEP}${dir ?? 'none'}`;
const linkIdOf = (key: string) => key.split(SEP)[0];

/** Module-level monotonic counter for ordering entries on the same link. */
let _seq = 0;

/**
 * Flashes a link when its marker matches live traffic, and — when the match
 * carries a direction (`dir`) — draws evenly-spaced arrows (鱼鳞) along the link
 * pointing toward the traffic receiver.
 *
 * State is a signal of composite-key → FlashState.  On each `flash(...)`:
 *   - the entry for that (linkId, dir) slot is (re)added
 *   - a per-slot timer is (re)set (同方向续命, 不同方向独立过期)
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
  /** Per-slot debounce timers (续命). */
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** UI default highlight duration when a marker has no `highlight_duration`. */
  private readonly DEFAULT_FLASH_MS = 800;
  private readonly effectRef: EffectRef;
  /** Previous snapshot for diffing (composite-key → state). */
  private prev = new Map<string, FlashState>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.effectRef = effect(() => this.applyDiff(this._flashing()));
    destroyRef.onDestroy(() => {
      this.effectRef.destroy();
      for (const key of [...this.prev.keys()]) this.clearLink(linkIdOf(key));
      this.prev.clear();
      for (const t of this.timers.values()) clearTimeout(t);
      this.timers.clear();
    });
  }

  /**
   * Flash a link. Repeated calls with the same direction within the duration
   * window keep that direction lit (续命).  Calls with a *different* direction
   * start an independent timer — the old direction stays active until its own
   * timer expires (方向变化不续命).
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
    clearTimeout(this.timers.get(key));
    this.timers.set(key, setTimeout(() => this.expire(key), ms));

    // Same-state guard: under heavy traffic (e.g. ping -f),
    // repeated matches with identical color / direction / capture node
    // only extend the timer — no Map copy, no signal update, no effect.
    // Without this, every match copies the Map and fires the full diff
    // pipeline even though the DOM is unchanged; the churn leaks into
    // GC pressure and browser memory climbs.
    const existing = this._flashing().get(key);
    if (existing && existing.color === color && existing.dir === dir && existing.captureNodeId === captureNodeId) {
      return;
    }

    const state: FlashState = { color, dir, captureNodeId, _seq: _seq++ };
    this._flashing.update((m) => {
      const next = new Map(m);
      next.set(key, state);
      return next;
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
    this.renderDirArrow(group, path, state, slot);
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
    // jsdom (unit tests) doesn't implement path geometry — bail out quietly there.
    let len: number;
    try {
      len = node.getTotalLength();
    } catch {
      return;
    }
    if (!len || !Number.isFinite(len)) return;

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
      const behind = this.pointAt(node, Math.max(0, at - ARROW_TANGENT_EPS));
      const ahead = this.pointAt(node, Math.min(len, at + ARROW_TANGENT_EPS));
      const pos = this.pointAt(node, at);
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
