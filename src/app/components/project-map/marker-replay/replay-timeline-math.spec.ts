import { describe, it, expect } from 'vitest';
import {
  stepForWheel,
  initialWheelState,
  chooseTickStep,
  ticksFor,
  formatFrameTime,
  formatDelta,
  bucketBarWidth,
  MAX_STEP_FRAMES,
  TICK_PIXELS,
  WheelState,
} from './replay-timeline-math';
import { ReplayFrame } from '@models/marker-replay';

/** Simulate a burst of wheel events, returning the steps produced. */
function runBurst(deltas: number[], start: number, gapMs = 50, maxStep = MAX_STEP_FRAMES): number[] {
  let state = initialWheelState();
  const steps: number[] = [];
  deltas.forEach((d, i) => {
    const r = stepForWheel(state, d, start + i * gapMs, maxStep);
    state = r.state;
    steps.push(r.step);
  });
  return steps;
}

describe('stepForWheel', () => {
  it('a single isolated notch steps by exactly 1', () => {
    // Standard Chrome notch ≈ ±100px → 1.9 ticks → still the ≤2-tick regime.
    expect(runBurst([100], 0)).toEqual([1]);
    expect(runBurst([-100], 0)).toEqual([-1]);
  });

  it('sustained spinning climbs the 1,1,2,2,4,4,… ladder capped at maxStep', () => {
    const steps = runBurst(Array.from({ length: 40 }, () => 100), 0);
    // ticks per event: 1.9, 3.8, 5.7, 7.5, 9.4, 11.3, 13.2, … → floor: 1,3,5,7,9,11,13
    expect(steps.slice(0, 8)).toEqual([1, 2, 4, 8, 16, 32, 64, 64]);
    expect(Math.max(...steps.map(Math.abs))).toBe(MAX_STEP_FRAMES);
  });

  it('a gap > WHEEL_GAP_MS resets the burst', () => {
    let state = initialWheelState();
    // Two quick notches → burst of ~3.8 ticks → step 2.
    const fast = stepForWheel(state, 100, 0, MAX_STEP_FRAMES);
    state = fast.state;
    expect(stepForWheel(state, 100, 500, MAX_STEP_FRAMES).step).toBe(1);
  });

  it('a direction flip resets the burst', () => {
    let state: WheelState = initialWheelState();
    const a = stepForWheel(state, 100, 0, MAX_STEP_FRAMES);
    state = a.state;
    const b = stepForWheel(state, 100, 10, MAX_STEP_FRAMES); // same dir, same burst
    state = b.state;
    expect(b.step).toBe(2);
    const c = stepForWheel(state, -100, 20, MAX_STEP_FRAMES); // flip → new burst
    expect(c.step).toBe(-1);
  });

  it('zero / non-finite deltaY yields step 0 and keeps the burst direction', () => {
    const r = stepForWheel({ units: 5, dir: 1, lastAt: 0 }, 0, 10, MAX_STEP_FRAMES);
    expect(r.step).toBe(0);
    expect(r.state.dir).toBe(1);
  });

  it('trackpad micro-deltas accumulate across events', () => {
    // Many +8px events close together ≈ a slow trackpad scroll: after ~7 events
    // (56px = 1 tick) it should have moved at least 1 frame, not 0.
    const steps = runBurst(Array.from({ length: 10 }, () => 8), 0);
    expect(steps[0]).toBeGreaterThanOrEqual(1);
  });

  it('respects a custom maxStep (bucket mode uses 128)', () => {
    const steps = runBurst(Array.from({ length: 40 }, () => 100), 0, 50, 128);
    expect(Math.max(...steps.map(Math.abs))).toBe(128);
  });
});

describe('chooseTickStep', () => {
  it('short spans keep 1s ticks', () => {
    expect(chooseTickStep(10)).toBe(1);
    expect(chooseTickStep(15)).toBe(1);
  });

  it('picks the smallest step yielding ≤15 ticks', () => {
    expect(chooseTickStep(100)).toBe(10); // 100/10 = 10 ≤ 15 (5 → 20 > 15)
    expect(chooseTickStep(30)).toBe(2); // 30/2 = 15 ≤ 15
    expect(chooseTickStep(3600)).toBe(300); // 3600/300 = 12
  });

  it('saturates at the ladder end for huge spans', () => {
    expect(chooseTickStep(100 * 24 * 3600)).toBe(172800);
  });
});

describe('ticksFor', () => {
  const mk = (ts: string, i: number): ReplayFrame => ({
    ts,
    len: 60,
    node_id: 'n1',
    link_id: 'l1',
    marker: 'm',
    frame_number: i + 1,
  });

  it('anchors each boundary at the first frame ≥ the boundary and dedupes indices', () => {
    // Frames at …60.5, …61.2, …62.9 with 1s ticks → boundaries 60 (contains the
    // first frame → anchors at index 0), 61 (→index 1), 62 (→index 2).
    const frames = [mk('1788196660.500000', 0), mk('1788196661.200000', 1), mk('1788196662.900000', 2)];
    const ticks = ticksFor(frames, 1);
    expect(ticks.map((t) => t.index)).toEqual([0, 1, 2]);
    expect(ticks.every((t) => /^\d{2}:\d{2}:\d{2}$/.test(t.label))).toBe(true);
  });

  it('deduplicates boundaries landing on the same frame (sparse captures)', () => {
    const frames = [mk('1788196660.100000', 0), mk('1788196665.100000', 1)];
    const ticks = ticksFor(frames, 1);
    // Boundaries 661..665 all anchor at index 1 → deduped to a single tick.
    expect(ticks.filter((t) => t.index === 1).length).toBe(1);
  });

  it('returns empty for empty frames or non-positive step', () => {
    expect(ticksFor([], 1)).toEqual([]);
    expect(ticksFor([mk('1.000000', 0)], 0)).toEqual([]);
  });

  it('never exceeds the defensive tick cap', () => {
    const frames = [mk('100.000000', 0), mk('99999.000000', 1)];
    expect(ticksFor(frames, 1).length).toBeLessThanOrEqual(64);
  });
});

describe('formatFrameTime / formatDelta', () => {
  it('formats local HH:MM:SS from a ts string', () => {
    const d = new Date(1788196663.226372 * 1000);
    const expected = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    expect(formatFrameTime('1788196663.226372')).toBe(expected);
  });

  it('delta keeps 3 decimals with an explicit sign', () => {
    expect(formatDelta('1788196663.226372', '1788196662.000000')).toBe('+1.226s');
    expect(formatDelta('1788196660.5', '1788196662.0')).toBe('−1.500s');
    expect(formatDelta('5.0', '5.0')).toBe('+0.000s');
  });
});

describe('bucketBarWidth', () => {
  it('scales with count/maxCount and enforces the 3px minimum', () => {
    expect(bucketBarWidth(50, 100, 100)).toBe(50);
    expect(bucketBarWidth(1, 100, 100)).toBe(3);
    expect(bucketBarWidth(0, 100, 100)).toBe(0);
    expect(bucketBarWidth(10, 0, 100)).toBe(0); // degenerate max guard
  });
});
