/**
 * Pure geometry for the replay windows: the pinned comparison windows'
 * dock/snap/cluster placement. No Angular, no DOM — directly testable in
 * jsdom (the components wrap these with their own state).
 *
 * The generic viewport-clamp helpers live in the shared floating-window kit
 * (`../floating-window/floating-window-geometry`) and are re-exported here
 * for the replay components/specs that historically imported them from
 * this module.
 */

import { Rect, VIEWPORT_MARGIN, WINDOW_GUTTER, WINDOW_GUTTER_BOTTOM } from '../../floating-window/floating-window-geometry';

export { clampRect, clampWindowSize, VIEWPORT_MARGIN, WINDOW_GUTTER, WINDOW_GUTTER_BOTTOM } from '../../floating-window/floating-window-geometry';
export type { Rect } from '../../floating-window/floating-window-geometry';

// ---- pinned-window dock ---------------------------------------------------

/** Default dock tile size — the user's last manual resize overrides it. */
export const DOCK_TILE_W = 440;
export const DOCK_TILE_H = 360;
/**
 * Gap between windows — dock tiles/rows, magnetically-snapped seams and
 * cluster appends alike. NOT zero on purpose: every window's edge resize
 * handles reach outside its border box, so a zero-gap seam stacks both
 * windows' handle strips directly on the left one's scrollbar and makes it
 * unclickable. One constant keeps every window-to-window contact the same.
 */
export const DOCK_GAP = 12;
/** Bottom dock never rises above the project toolbar (+ margin). */
const DOCK_TOP_LIMIT = 80;

export interface DockSlot {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Uniform slot for pinned comparison window `index` of `count`: a
 * bottom-anchored flow that fills left→right and wraps UPWARD, in pin order —
 * the deterministic "comparison row". While docked the slot owns BOTH position
 * and size; dragging or resizing a window frees it (`reanchor()` re-docks it).
 *
 * `target` is the desired tile size — the session's remembered user size when
 * one exists (the last manual resize), else the {@link DOCK_TILE_W}/
 * {@link DOCK_TILE_H} defaults; rows/columns still compress it to fit.
 */
export function dockSlot(
  index: number,
  count: number,
  viewport: { width: number; height: number },
  target: { width: number; height: number } = { width: DOCK_TILE_W, height: DOCK_TILE_H }
): DockSlot {
  const left0 = VIEWPORT_MARGIN;
  const right = viewport.width - VIEWPORT_MARGIN;
  const usableW = Math.max(DOCK_GAP, right - left0);
  const cols = Math.max(1, Math.floor((usableW + DOCK_GAP) / (target.width + DOCK_GAP)));
  const width = Math.max(200, Math.min(target.width, Math.floor((usableW - (cols - 1) * DOCK_GAP) / cols)));

  const rows = Math.max(1, Math.ceil(count / cols));
  const usableH = Math.max(DOCK_GAP, viewport.height - VIEWPORT_MARGIN - DOCK_TOP_LIMIT);
  const height = Math.max(160, Math.min(target.height, Math.floor((usableH - (rows - 1) * DOCK_GAP) / rows)));

  const col = index % cols;
  const row = Math.floor(index / cols); // row 0 = bottom
  return {
    left: left0 + col * (width + DOCK_GAP),
    top: viewport.height - VIEWPORT_MARGIN - height - row * (height + DOCK_GAP),
    width,
    height,
  };
}

// ---- magnetic snap (dragging + resizing the replay windows) ----------------

/** Snap distance in px — a dragged edge within this of a sibling's attaches. */
export const SNAP_THRESHOLD = 12;

/**
 * Magnetic snap of a dragged pinned window against its settled siblings'
 * rects: within {@link SNAP_THRESHOLD} an edge attaches BESIDE the sibling
 * (one {@link DOCK_GAP} seam — see its comment) or aligns with it
 * (column/row), per axis independently — the nearest candidate per axis
 * wins, so dragging two windows together builds tidy comparison grids.
 * No perpendicular-overlap requirement: aligning to a window in another row is
 * exactly how tidy columns get built.
 */
export function snapRect(tentative: Rect, siblings: Rect[], threshold: number = SNAP_THRESHOLD): Rect {
  let left = tentative.left;
  let top = tentative.top;
  let bestX = threshold + 1;
  let bestY = threshold + 1;
  for (const s of siblings) {
    // My LEFT may attach to: the sibling's left (align), its right edge plus
    // the seam (I sit on its right), or its left minus the seam and my width
    // (I sit on its left). The seam keeps both windows' resize handles — and
    // the left one's scrollbar — mutually reachable.
    for (const cx of [s.left, s.left + s.width + DOCK_GAP, s.left - DOCK_GAP - tentative.width]) {
      const d = Math.abs(cx - tentative.left);
      if (d < bestX) {
        bestX = d;
        left = cx;
      }
    }
    for (const cy of [s.top, s.top + s.height + DOCK_GAP, s.top - DOCK_GAP - tentative.height]) {
      const d = Math.abs(cy - tentative.top);
      if (d < bestY) {
        bestY = d;
        top = cy;
      }
    }
  }
  return { left, top, width: tentative.width, height: tentative.height };
}

/** Where a snap engaged: the guide line's viewport coordinate, null per idle axis. */
export interface SnapGuides {
  /** Vertical guide line at this viewport x (an edge pair aligned/attached). */
  x: number | null;
  /** Horizontal guide line at this viewport y. */
  y: number | null;
}

/** A snap pass's product: the (possibly) adjusted rect + what engaged. */
export interface SnapResult {
  rect: Rect;
  guides: SnapGuides;
}

/**
 * One attach candidate per axis: where MY anchor edge would sit (`at`, in
 * viewport px) and the contact line a guide should highlight (`guide` — the
 * SIBLING's (or rail's) edge, so the line reads as "you snapped to THIS",
 * not as a stranger stripe through my own window).
 */
interface SnapCandidate {
  at: number;
  guide: number;
}

/**
 * Sibling attach candidates for one axis, generic over x/y (`start`/`size` =
 * the sibling's edge and extent on that axis, `extent` = MINE): align
 * edge-to-edge, sit after it, or sit before it — always one seam apart.
 */
function attachCandidates(start: number, size: number, gap: number, extent: number): SnapCandidate[] {
  return [
    { at: start, guide: start }, // edge-to-edge align (tidy columns/rows)
    { at: start + size + gap, guide: start + size }, // I sit after it
    { at: start - gap - extent, guide: start }, // I sit before it
  ];
}

/**
 * Magnetic snap of ANY dragged replay window (main, pinned, peek) against
 * both its sibling windows AND the viewport rails (the toolbar clearance
 * `minTop`, the left/right/top screen edges): the same attach model as
 * {@link snapRect} — nearest candidate per axis wins, one {@link DOCK_GAP}
 * seam between windows — plus the coordinates the caller renders as snap
 * guide lines while the gesture is live. Viewport rails snap FLUSH (no gap):
 * a window dragged to a screen edge parks hard against it.
 */
export function snapDraggedWindow(
  tentative: Rect,
  siblings: Rect[],
  viewport: { width: number; height: number },
  minTop: number,
  threshold: number = SNAP_THRESHOLD
): SnapResult {
  const xs: SnapCandidate[] = [];
  const ys: SnapCandidate[] = [];
  for (const s of siblings) {
    xs.push(...attachCandidates(s.left, s.width, DOCK_GAP, tentative.width));
    ys.push(...attachCandidates(s.top, s.height, DOCK_GAP, tentative.height));
  }
  // Viewport rails: flush to the usable screen edges.
  xs.push({ at: 0, guide: 0 }, { at: viewport.width - tentative.width, guide: viewport.width });
  ys.push({ at: minTop, guide: minTop }, { at: viewport.height - tentative.height, guide: viewport.height });

  const pick = (from: SnapCandidate[], anchor: number): SnapCandidate | null => {
    let best: SnapCandidate | null = null;
    let bestD = threshold + 1;
    for (const c of from) {
      const d = Math.abs(c.at - anchor);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return bestD <= threshold ? best : null;
  };

  const pickX = pick(xs, tentative.left);
  const pickY = pick(ys, tentative.top);
  return {
    rect: {
      left: pickX ? pickX.at : tentative.left,
      top: pickY ? pickY.at : tentative.top,
      width: tentative.width,
      height: tentative.height,
    },
    guides: { x: pickX ? pickX.guide : null, y: pickY ? pickY.guide : null },
  };
}

/** Which edges a resize gesture drags (mwlResizable's `ResizeEvent.edges`). */
export interface ResizeEdges {
  top?: boolean | number;
  left?: boolean | number;
  right?: boolean | number;
  bottom?: boolean | number;
}

/**
 * Magnetic snap of a RESIZE in flight: each dragged edge attaches to the
 * nearest sibling edge (one {@link DOCK_GAP} seam, like drag snapping) or
 * the viewport rail (the same ceilings {@link clampWindowSize} enforces),
 * while the OPPOSITE edges stay put — per axis independently, so corner
 * drags attach on both. Candidates that would push the size under
 * `minW`/`minH` are skipped (the directive's own minimum validation then
 * freezes the edge instead — the gesture never breaks).
 */
export function snapResizedWindow(
  current: Rect,
  edges: ResizeEdges,
  siblings: Rect[],
  viewport: { width: number; height: number },
  minTop: number,
  minW: number,
  minH: number,
  threshold: number = SNAP_THRESHOLD
): SnapResult {
  let { left, top, width, height } = current;
  let guideX: number | null = null;
  let guideY: number | null = null;

  const attach = (candidates: SnapCandidate[], edge: number): SnapCandidate | null => {
    let best: SnapCandidate | null = null;
    let bestD = threshold + 1;
    for (const c of candidates) {
      const d = Math.abs(c.at - edge);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return bestD <= threshold ? best : null;
  };

  if (edges.left) {
    // My LEFT edge may attach to: a sibling's left (align), its right + seam
    // (I grow out of its right side), or its left − seam − MY WIDTH (my whole
    // window sits before it — the sibling's left minus just the seam would
    // leave my window overlapping it); rails: flush 0.
    const cands: SnapCandidate[] = [];
    for (const s of siblings) {
      cands.push({ at: s.left, guide: s.left }, { at: s.left + s.width + DOCK_GAP, guide: s.left + s.width }, {
        at: s.left - DOCK_GAP - width,
        guide: s.left,
      });
    }
    cands.push({ at: 0, guide: 0 });
    const hit = attach(cands, left);
    if (hit && left + width - hit.at >= minW) {
      width = left + width - hit.at;
      left = hit.at;
      guideX = hit.guide;
    }
  }
  if (edges.right) {
    const right = left + width;
    const cands: SnapCandidate[] = [];
    // A TRAILING edge docks at the sibling's edges — one seam BEFORE its
    // left (my window ends before it) or aligned with its far edge. There is
    // deliberately no "one seam PAST the far edge" candidate: that is the
    // drag logic (a LEADING edge sits after the sibling); on a trailing edge
    // it parked my window 12 px past the sibling with the guide still on the
    // sibling's edge, i.e. a false dock that overlaps it.
    for (const s of siblings) {
      cands.push({ at: s.left - DOCK_GAP, guide: s.left }, { at: s.left + s.width, guide: s.left + s.width });
    }
    cands.push({ at: viewport.width - WINDOW_GUTTER, guide: viewport.width - WINDOW_GUTTER });
    const hit = attach(cands, right);
    if (hit && hit.at - left >= minW) {
      width = hit.at - left;
      guideX = hit.guide;
    }
  }
  if (edges.top) {
    const cands: SnapCandidate[] = [];
    for (const s of siblings) {
      cands.push({ at: s.top, guide: s.top }, { at: s.top + s.height + DOCK_GAP, guide: s.top + s.height }, {
        at: s.top - DOCK_GAP - height,
        guide: s.top,
      });
    }
    cands.push({ at: minTop, guide: minTop });
    const hit = attach(cands, top);
    if (hit && top + height - hit.at >= minH) {
      height = top + height - hit.at;
      top = hit.at;
      guideY = hit.guide;
    }
  }
  if (edges.bottom) {
    const bottom = top + height;
    const cands: SnapCandidate[] = [];
    // Trailing edge, same rule as the right branch: attach at the sibling's
    // edges, never one seam PAST its far edge.
    for (const s of siblings) {
      cands.push({ at: s.top - DOCK_GAP, guide: s.top }, { at: s.top + s.height, guide: s.top + s.height });
    }
    cands.push({ at: viewport.height - WINDOW_GUTTER_BOTTOM, guide: viewport.height - WINDOW_GUTTER_BOTTOM });
    const hit = attach(cands, bottom);
    if (hit && hit.at - top >= minH) {
      height = hit.at - top;
      guideY = hit.guide;
    }
  }

  return { rect: { left, top, width, height }, guides: { x: guideX, y: guideY } };
}

// ---- cluster join (new pins beside hand-arranged windows) -----------------

/**
 * Where a NEW pinned window joins the user's hand-arranged cluster: right of
 * the RIGHTMOST arranged window, top-aligned with it, one {@link DOCK_GAP}
 * seam away (the same contact magnetic snapping produces); when the viewport's
 * right edge is reached the cluster wraps to a fresh row below — again one
 * seam — aligned with the leftmost arranged window. Null when nothing is
 * arranged — the caller docks into the comparison row instead.
 */
export function clusterAppend(
  arranged: Rect[],
  mine: { width: number; height: number },
  viewport: { width: number; height: number }
): { left: number; top: number } | null {
  if (arranged.length === 0) return null;
  const rightmost = arranged.reduce((a, b) => (a.left + a.width >= b.left + b.width ? a : b));
  let left = rightmost.left + rightmost.width + DOCK_GAP;
  let top = rightmost.top;
  if (left + mine.width > viewport.width - VIEWPORT_MARGIN) {
    const bottom = arranged.reduce((a, b) => (a.top + a.height >= b.top + b.height ? a : b));
    const leftmost = arranged.reduce((a, b) => (a.left <= b.left ? a : b));
    left = leftmost.left;
    top = bottom.top + bottom.height + DOCK_GAP;
  }
  // Clamp into the viewport (a cluster near an edge may still overlap it).
  left = Math.max(0, Math.min(left, Math.max(0, viewport.width - mine.width)));
  top = Math.max(64, Math.min(top, Math.max(64, viewport.height - mine.height)));
  return { left, top };
}
