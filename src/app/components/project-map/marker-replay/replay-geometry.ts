/**
 * Pure geometry for the replay detail window: canvas→screen conversion and
 * viewport-aware window placement. No Angular, no DOM — directly testable in
 * jsdom (the live component wraps these with d3 path queries).
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Gap between the anchor point and the window's near edge. */
export const ANCHOR_GAP = 28;
/** Viewport margin kept clear on every side. */
export const VIEWPORT_MARGIN = 16;

/**
 * Canvas coordinates → viewport (screen) coordinates, using the exact map
 * formula (cf. text-editor.component.ts): the canvas group is transformed by
 * `translate(zeroZero + pan) scale(k)`, so a canvas point lands at
 * `canvas * k + zeroZero + pan`.
 */
export function canvasToScreen(
  p: Point,
  k: number,
  panX: number,
  panY: number,
  zeroZero: Point
): Point {
  return {
    x: p.x * k + zeroZero.x + panX,
    y: p.y * k + zeroZero.y + panY,
  };
}

export interface WindowPlacement {
  rect: Rect;
  /** Which window edge faces the anchor (leader-line attachment side). */
  side: 'left' | 'right';
}

/**
 * Place the detail window beside its anchor (the link midpoint, screen space).
 *
 * Preference is upper-right of the anchor; when the window would overflow the
 * right viewport edge it flips to the left side. Top/bottom are clamped below
 * the project toolbar (`topOffset`) and above the viewport bottom. On very
 * small viewports the clamps may let the window cover the anchor — positioning
 * correctness wins over overlap avoidance there.
 */
export function placeWindow(
  anchor: Point,
  win: { width: number; height: number },
  viewport: { width: number; height: number; topOffset: number }
): WindowPlacement {
  let left = anchor.x + ANCHOR_GAP;
  let side: 'left' | 'right' = 'right';
  if (left + win.width > viewport.width - VIEWPORT_MARGIN) {
    side = 'left';
    left = anchor.x - ANCHOR_GAP - win.width;
  }
  // Horizontal clamp (after the flip, a wide window may overflow the left too).
  const minLeft = VIEWPORT_MARGIN;
  const maxLeft = Math.max(minLeft, viewport.width - win.width - VIEWPORT_MARGIN);
  left = Math.max(minLeft, Math.min(maxLeft, left));

  const minTop = viewport.topOffset + VIEWPORT_MARGIN;
  const maxTop = Math.max(minTop, viewport.height - win.height - VIEWPORT_MARGIN);
  const top = Math.max(minTop, Math.min(maxTop, anchor.y - ANCHOR_GAP));

  return { rect: { left, top, width: win.width, height: win.height }, side };
}

// ---- pinned-window dock ---------------------------------------------------

/** Default dock tile size — the user's last manual resize overrides it. */
export const DOCK_TILE_W = 440;
export const DOCK_TILE_H = 360;
/**
 * Gap between windows — dock tiles/rows, magnetically-snapped seams and
 * cluster appends alike. NOT zero on purpose: every window's edge resize
 * handles reach 8px inward (and 4px outward), so a zero-gap seam stacks both
 * windows' handle strips directly on the left one's scrollbar and makes it
 * unclickable. One constant keeps every window-to-window contact the same.
 */
export const DOCK_GAP = 12;
/** Right reserve so tiles don't slide under the docked replay panel. */
export const DOCK_RIGHT_RESERVE = 296;
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
 * the deterministic "comparison row" (vs. the live window, which anchors
 * beside its link). While docked the slot owns BOTH position and size;
 * dragging or resizing a window frees it (`reanchor()` re-docks it).
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
  // The replay panel (right-docked, ~280px) is only reserved once the viewport
  // is wide enough for it to matter — narrow screens use the full width.
  const right =
    viewport.width > DOCK_RIGHT_RESERVE + DOCK_TILE_W + VIEWPORT_MARGIN
      ? viewport.width - DOCK_RIGHT_RESERVE
      : viewport.width - VIEWPORT_MARGIN;
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

// ---- magnetic snap (dragging pinned windows) ------------------------------

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
