/**
 * Pure geometry shared by EVERY floating window (the floating-window skill's
 * clamp helpers): viewport clamping and size caps. No Angular, no DOM —
 * directly testable in jsdom. The marker-replay windows re-export these from
 * `replay-geometry.ts` for backward compatibility.
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

/**
 * Side gutters a floating window keeps inside the viewport — its edge resize
 * handles reach outside the border box, so a flush edge would push them
 * off-screen (and under the browser chrome).
 */
export const WINDOW_GUTTER = 32;
/** Bottom gutter — room below the viewport (taskbar/dock territory). */
export const WINDOW_GUTTER_BOTTOM = 96;

/**
 * Clamp a floating window's SIZE into the viewport without moving it: each
 * axis keeps its minimum (`minW`/`minH`) even past the viewport (position is
 * clampRect's job afterwards) but otherwise caps at viewport-minus-gutter.
 * Resize-end, width-apply and viewport-reclamp all agree because there is
 * ONE definition.
 */
export function clampWindowSize(
  w: number,
  h: number,
  viewport: { width: number; height: number },
  minW: number,
  minH: number
): { width: number; height: number } {
  return {
    width: Math.min(Math.max(w, minW), Math.max(viewport.width - WINDOW_GUTTER, minW)),
    height: Math.min(Math.max(h, minH), Math.max(viewport.height - WINDOW_GUTTER_BOTTOM, minH)),
  };
}
