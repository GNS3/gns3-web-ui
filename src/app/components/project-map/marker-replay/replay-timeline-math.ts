import { ReplayBucket, ReplayFrame } from '@models/marker-replay';

/**
 * Pure math for the replay timeline tape. No Angular, no DOM — everything here
 * is directly unit-testable (jsdom included).
 *
 * ts handling: `Number(ts)` appears ONLY in this file, and only for DISPLAY
 * (labels) and tick GEOMETRY (binary search). The strings themselves are never
 * re-serialized and never sent back to the server from here.
 */

// ---------------------------------------------------------------------------
// Wheel-speed-sensitive stepping
// ---------------------------------------------------------------------------

/** Accumulated wheel-burst state between events (one instance per tape). */
export interface WheelState {
  /** Fractional burst length in "ticks" (1 tick = {@link TICK_PIXELS} px of |deltaY|). */
  units: number;
  /** Direction of the current burst (+1 down / −1 up); a flip resets the burst. */
  dir: number;
  /** `performance.now()` of the last wheel event. */
  lastAt: number;
}

/** Wheel events arriving farther apart than this start a new burst (slow scrub). */
export const WHEEL_GAP_MS = 120;
/** Accumulated |deltaY| counted as one "tick" (normalizes notch wheels vs trackpad streams). */
export const TICK_PIXELS = 53;
/** Fast-scroll jump cap for frame-level navigation. */
export const MAX_STEP_FRAMES = 64;
/** Fast-scroll jump cap for bucket-level navigation. */
export const MAX_STEP_BUCKETS = 128;

/**
 * Map one wheel event to a signed navigation step.
 *
 * Magnitude-accumulating burst counter: |deltaY| accumulates across events of
 * the same gesture; every {@link TICK_PIXELS} px counts as one tick. The first
 * two ticks of a burst step by 1 (a slow, discrete scrub); sustained spinning
 * climbs an exponential ladder (2, 4, 8, 16, …) capped at `maxStep`. A gap
 * larger than {@link WHEEL_GAP_MS} or a direction flip starts a new burst.
 *
 * Sign: deltaY > 0 (wheel down) moves FORWARD in time (+), deltaY < 0 backward.
 */
export function stepForWheel(
  prev: WheelState,
  deltaY: number,
  now: number,
  maxStep: number
): { step: number; state: WheelState } {
  if (deltaY === 0 || !Number.isFinite(deltaY)) {
    return { step: 0, state: { ...prev, lastAt: now } };
  }
  const dir = deltaY > 0 ? 1 : -1;
  const stale = now - prev.lastAt > WHEEL_GAP_MS || prev.dir !== dir;
  const units = (stale ? 0 : prev.units) + Math.abs(deltaY) / TICK_PIXELS;
  const state: WheelState = { units, dir, lastAt: now };
  const ticks = Math.floor(units);
  let step: number;
  if (ticks <= 2) {
    step = 1;
  } else {
    // ticks 3,4 → 2; 5,6 → 4; 7,8 → 8; … capped.
    step = Math.min(2 ** Math.ceil((ticks - 2) / 2), maxStep);
  }
  return { step: step * dir, state };
}

/** Fresh burst state. */
export function initialWheelState(): WheelState {
  return { units: 0, dir: 0, lastAt: -Infinity };
}

// ---------------------------------------------------------------------------
// Adaptive tick granularity
// ---------------------------------------------------------------------------

/** Second ladders for tick labels (1s → 48h). */
const TICK_LADDER = [1, 2, 5, 10, 30, 60, 120, 300, 600, 1800, 3600, 7200, 10800, 14400, 21600, 43200, 86400, 172800];

/**
 * Smallest ladder step (seconds) for which the span yields ≤ 15 major ticks,
 * so the tape always shows a readable 8–15-tick rail. Spans shorter than 15s
 * keep 1s ticks even when that means fewer than 15.
 */
export function chooseTickStep(spanSec: number): number {
  for (const step of TICK_LADDER) {
    if (spanSec / step <= 15) return step;
  }
  return TICK_LADDER[TICK_LADDER.length - 1];
}

/** A major tick: the frame INDEX it anchors to plus its HH:MM:SS label. */
export interface TimelineTick {
  index: number;
  label: string;
}

/** Defensive cap — chooseTickStep bounds ticks, but never trust callers. */
const MAX_TICKS = 64;

/**
 * Major ticks for the tape: every `stepSec` boundary inside [first, last],
 * each anchored at the FIRST frame whose time is ≥ the boundary (binary search
 * on the numeric value — display/geometry only). Adjacent boundaries collapsing
 * onto the same frame index are deduplicated.
 */
export function ticksFor(frames: ReplayFrame[], stepSec: number): TimelineTick[] {
  const ticks: TimelineTick[] = [];
  if (frames.length === 0 || stepSec <= 0) return ticks;
  const firstSec = Math.floor(Number(frames[0].ts));
  const lastSec = Math.ceil(Number(frames[frames.length - 1].ts));
  let boundary = Math.ceil(firstSec / stepSec) * stepSec;
  let lastIndex = -1;
  while (boundary <= lastSec && ticks.length < MAX_TICKS) {
    const index = firstFrameAtOrAfter(frames, boundary);
    if (index !== lastIndex) {
      ticks.push({ index, label: formatSeconds(boundary) });
      lastIndex = index;
    }
    boundary += stepSec;
  }
  return ticks;
}

/** First frame index whose numeric ts is ≥ `sec` (frames are time-sorted). */
function firstFrameAtOrAfter(frames: ReplayFrame[], sec: number): number {
  let lo = 0;
  let hi = frames.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (Number(frames[mid].ts) < sec) lo = mid + 1;
    else hi = mid;
  }
  return Math.min(lo, frames.length - 1);
}

// ---------------------------------------------------------------------------
// Time display (HH:MM:SS local; µs precision kept in the delta only)
// ---------------------------------------------------------------------------

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Whole epoch seconds → local "HH:MM:SS". */
export function formatSeconds(sec: number): string {
  const d = new Date(sec * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** Frame ts string → local "HH:MM:SS" (display only — the string itself never changes). */
export function formatFrameTime(ts: string): string {
  return formatSeconds(Math.floor(Number(ts)));
}

/** Wireshark-style relative time: "+1.234s" from the timeline's first frame. */
export function formatDelta(ts: string, firstTs: string): string {
  const delta = Number(ts) - Number(firstTs);
  const sign = delta < 0 ? '−' : '+';
  return `${sign}${Math.abs(delta).toFixed(3)}s`;
}

/** Max bucket bar width fraction helpers (bar width ∝ count / maxCount). */
export function bucketBarWidth(count: number, maxCount: number, fullPx: number): number {
  if (count <= 0 || maxCount <= 0) return 0;
  return Math.max(3, Math.round((count / maxCount) * fullPx));
}

/** Convenience: the max count across buckets (tape full-bar reference). */
export function maxBucketCount(buckets: ReplayBucket[]): number {
  return buckets.reduce((m, b) => Math.max(m, b.count), 0);
}
