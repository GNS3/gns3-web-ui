/**
 * Pure geometry for the replay windows: viewport clamping and the pinned
 * comparison windows' dock/snap/cluster placement. No Angular, no DOM —
 * directly testable in jsdom (the components wrap these with their own state).
 */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Viewport margin kept clear on every side. */
export const VIEWPORT_MARGIN = 16;

/**
 * Clamp a window rect into the viewport: never left of 0, never above
 * `minTop` (the project toolbar), never past the right/bottom edges. Windows
 * larger than the viewport pin to the top-left corner of their allowed area.
 */
export function clampRect(rect: Rect, viewport: { width: number; height: number }, minTop: number): Rect {
  const maxLeft = Math.max(0, viewport.width - rect.width);
  const maxTop = Math.max(minTop, viewport.height - rect.height);
  return {
    left: Math.min(Math.max(rect.left, 0), maxLeft),
    top: Math.min(Math.max(rect.top, minTop), maxTop),
    width: rect.width,
    height: rect.height,
  };
}

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
