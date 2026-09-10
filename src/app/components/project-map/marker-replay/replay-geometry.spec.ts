import { describe, it, expect } from 'vitest';
import { clampRect, clampWindowSize, dockSlot, snapRect, clusterAppend, VIEWPORT_MARGIN, DOCK_GAP, DOCK_TILE_W, DOCK_TILE_H, SNAP_THRESHOLD } from './replay-geometry';

describe('clampWindowSize (resize-end / viewport-reclamp shared math)', () => {
  const viewport = { width: 1920, height: 1080 };

  it('passes an in-range size through untouched', () => {
    expect(clampWindowSize(1100, 640, viewport, 760, 420)).toEqual({ width: 1100, height: 640 });
  });

  it('lifts an under-minimum size to the minimum', () => {
    expect(clampWindowSize(100, 100, viewport, 760, 420)).toEqual({ width: 760, height: 420 });
  });

  it('caps at viewport-minus-gutter (32 sides, 96 bottom)', () => {
    expect(clampWindowSize(2500, 2000, viewport, 760, 420)).toEqual({ width: 1888, height: 984 });
  });

  it('keeps the minimum even when the viewport is smaller than it', () => {
    // A 600px viewport cannot satisfy a 760px floor — the floor wins (the
    // position is clampRect's job afterwards).
    expect(clampWindowSize(700, 400, { width: 600, height: 500 }, 760, 420)).toEqual({ width: 760, height: 420 });
  });
});

describe('clampRect (window viewport clamping)', () => {
  const viewport = { width: 1920, height: 1080 };
  const minTop = 64;

  it('passes an in-range rect through untouched', () => {
    const r = clampRect({ left: 300, top: 200, width: 440, height: 320 }, viewport, minTop);
    expect(r).toEqual({ left: 300, top: 200, width: 440, height: 320 });
  });

  it('never leaves the left edge or rises above the toolbar', () => {
    const r = clampRect({ left: -50, top: 10, width: 440, height: 320 }, viewport, minTop);
    expect(r.left).toBe(0);
    expect(r.top).toBe(minTop);
  });

  it('never overflows the right or bottom edges', () => {
    const r = clampRect({ left: 1900, top: 1000, width: 440, height: 320 }, viewport, minTop);
    expect(r.left).toBe(viewport.width - 440);
    expect(r.top).toBe(viewport.height - 320);
  });

  it('a window larger than the viewport pins to the top-left of its allowed area', () => {
    const r = clampRect({ left: 500, top: 500, width: 2500, height: 2000 }, viewport, minTop);
    expect(r.left).toBe(0);
    expect(r.top).toBe(minTop);
  });
});

describe('dockSlot (pinned comparison row)', () => {
  const wide = { width: 1920, height: 1080 };

  it('a single pin docks at the bottom-left with the target tile size', () => {
    const s = dockSlot(0, 1, wide);
    expect(s).toMatchObject({ left: VIEWPORT_MARGIN, top: wide.height - VIEWPORT_MARGIN - DOCK_TILE_H });
    expect(s.width).toBe(DOCK_TILE_W);
    expect(s.height).toBe(DOCK_TILE_H);
  });

  it('pins flow left→right along the bottom, never overlapping', () => {
    const n = 3;
    const slots = Array.from({ length: n }, (_, i) => dockSlot(i, n, wide));
    for (let i = 1; i < n; i++) {
      expect(slots[i].top).toBe(slots[0].top); // same bottom row
      expect(slots[i].left).toBe(slots[i - 1].left + slots[i - 1].width + DOCK_GAP);
    }
    expect(slots[2].left + slots[2].width).toBeLessThanOrEqual(wide.width - VIEWPORT_MARGIN);
  });

  it('overflowing pins wrap UPWARD to a second row', () => {
    // 1920 full width → 4 columns of 440; 5 pins → the 5th starts row 2.
    const bottom = dockSlot(3, 5, wide);
    const above = dockSlot(4, 5, wide);
    expect(above.top).toBe(bottom.top - bottom.height - DOCK_GAP);
    expect(above.left).toBe(VIEWPORT_MARGIN); // wraps to the row's first column
  });

  it('keeps full-size tiles when they fit: two pins share one row at 1280', () => {
    const vp = { width: 1280, height: 800 };
    const slots = Array.from({ length: 2 }, (_, i) => dockSlot(i, 2, vp));
    expect(slots[1].top).toBe(slots[0].top); // one row — no wrap, no shrink
    expect(slots[0].width).toBe(DOCK_TILE_W);
    expect(slots[1].left + slots[1].width).toBeLessThanOrEqual(vp.width - VIEWPORT_MARGIN);
  });

  it('height compresses when many rows would rise past the toolbar', () => {
    const vp = { width: 900, height: 500 }; // 1 column → 4 pins = 4 rows
    const s = dockSlot(0, 4, vp);
    expect(s.height).toBeLessThan(DOCK_TILE_H);
    expect(s.top).toBeGreaterThanOrEqual(80); // never above the toolbar zone
  });

  it('a remembered user size becomes the tile target (still column-bound)', () => {
    const s = dockSlot(0, 2, { width: 1920, height: 1080 }, { width: 500, height: 400 });
    expect(s.width).toBe(500);
    expect(s.height).toBe(400);
    // Narrow remembered width lets MORE tiles share the row.
    const narrow = dockSlot(1, 2, { width: 1100, height: 800 }, { width: 380, height: 400 });
    expect(narrow.left).toBe(dockSlot(0, 2, { width: 1100, height: 800 }, { width: 380, height: 400 }).left + 380 + DOCK_GAP);
  });
});

describe('snapRect (magnetic drag snap)', () => {
  const sibling = { left: 200, top: 300, width: 440, height: 320 };
  const mine = { width: 440, height: 320 };

  it('attaches BESIDE the sibling (one seam gap) when my left lands near its right edge', () => {
    // Dragged to left 650 — within threshold of sibling.right + seam (652).
    const r = snapRect({ left: 650, top: 100, ...mine }, [sibling]);
    expect(r.left).toBe(652); // sibling.left + sibling.width + DOCK_GAP
    expect(r.top).toBe(100); // nothing near vertically
  });

  it('attaches me on the sibling’s left (one seam gap) when my right edge approaches it', () => {
    const rightSibling = { left: 700, top: 300, width: 440, height: 320 };
    // Dragged to left 255 → my right edge is 695; the seam target is
    // 700 − 12 − 440 = 248 (right edges 12px apart, handles don't stack).
    const r = snapRect({ left: 255, top: 100, ...mine }, [rightSibling]);
    expect(r.left).toBe(248); // sibling.left - DOCK_GAP - my width
  });

  it('aligns tops across rows (columns without perpendicular overlap)', () => {
    const r = snapRect({ left: 800, top: 308, ...mine }, [sibling]);
    expect(r.left).toBe(800); // far away horizontally — no x snap
    expect(r.top).toBe(300); // aligned to the sibling's top
  });

  it('does nothing beyond the threshold', () => {
    const r = snapRect({ left: sibling.left + SNAP_THRESHOLD + 1, top: 999, ...mine }, [sibling]);
    expect(r.left).toBe(sibling.left + SNAP_THRESHOLD + 1);
    expect(r.top).toBe(999);
  });

  it('the nearest candidate per axis wins across several siblings', () => {
    const near = { left: 505, top: 300, width: 100, height: 100 };
    const r = snapRect({ left: 500, top: 306, ...mine }, [sibling, near]);
    expect(r.left).toBe(505); // |505-500|=5 beats sibling's |200-500|
    expect(r.top).toBe(300); // both siblings offer top 300
  });

  it('size passes through untouched', () => {
    const r = snapRect({ left: 0, top: 0, width: 777, height: 111 }, []);
    expect(r).toEqual({ left: 0, top: 0, width: 777, height: 111 });
  });
});

describe('clusterAppend (new pins join the arranged cluster)', () => {
  const arranged = { left: 500, top: 300, width: 440, height: 360 };
  const mine = { width: 440, height: 360 };

  it('attaches right with one seam gap, top-aligned with the rightmost window', () => {
    expect(clusterAppend([arranged], mine, { width: 1920, height: 1080 })).toEqual({ left: 952, top: 300 });
  });

  it('wraps below the cluster (one seam) when the viewport right edge is reached', () => {
    // 952 + 440 > 1000 − 16 → new row below, aligned with the cluster's left.
    expect(clusterAppend([arranged], mine, { width: 1000, height: 1080 })).toEqual({ left: 500, top: 672 });
  });

  it('picks the rightmost of several arranged windows', () => {
    const second = { left: 940, top: 300, width: 300, height: 360 };
    expect(clusterAppend([arranged, second], mine, { width: 1920, height: 1080 })).toEqual({ left: 1252, top: 300 });
  });

  it('null with nothing arranged — the caller docks instead', () => {
    expect(clusterAppend([], mine, { width: 1920, height: 1080 })).toBeNull();
  });

  it('clamps when the cluster sits near the viewport edges', () => {
    const edge = { left: 1600, top: 900, width: 300, height: 200 };
    // Wraps below (1912+440 overflows) at left 1600/top 1112 — both clamp.
    expect(clusterAppend([edge], mine, { width: 1920, height: 1080 })).toEqual({ left: 1480, top: 720 });
  });
});
