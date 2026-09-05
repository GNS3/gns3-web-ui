import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReplayFrame } from '@models/marker-replay';
import { MarkerReplayService, sameReplayFrame } from '@services/marker-replay.service';
import {
  MAX_STEP_BUCKETS,
  MAX_STEP_FRAMES,
  TimelineTick,
  WheelState,
  bucketBarWidth as bucketBarWidthFor,
  chooseTickStep,
  formatDelta,
  formatFrameTime,
  formatSeconds,
  initialWheelState,
  maxBucketCount,
  stepForWheel,
  ticksFor,
} from './replay-timeline-math';

/** Vertical pitch of one frame line / bucket row on the tape (px). */
export const TAPE_ROW_H = 10;
/** Fixed tape viewport height (px) — the cursor sits at its vertical center. */
export const TAPE_VIEWPORT_H = 320;
/** Extra rows rendered above/below the viewport (scroll lookahead). */
const SLICE_BUFFER = 5;

/** A frame line (or bucket row) with its absolute index into the tape list. */
interface TapeRow<T> {
  index: number;
  item: T;
}

/**
 * The vertical timeline tape: one line per frame (or one bar per second in
 * truncated/bucket mode) with a FIXED CENTER CURSOR — the current entry always
 * sits mid-tape and the content translates under it.
 *
 * Interaction contract:
 *  - mouse wheel — slow ticks step 1 entry, sustained spinning accelerates
 *    (see {@link stepForWheel}); the detail request only fires after the
 *    selection settles (service debounce), so scrubbing costs zero requests.
 *  - ▲▼ buttons — exact ±1 stepping.
 *  - click a line — select that frame; click a bookmark chip — jump back.
 *
 * Rendering uses a manual visible-slice ("windowing"): rows are uniformly
 * pitched, so a computed slice around the current index keeps the DOM at
 * ~viewport/rowH + buffer nodes regardless of timeline length (≤5000 frames
 * full mode, buckets in truncated mode).
 */
@Component({
  selector: 'app-replay-timeline',
  templateUrl: './replay-timeline.component.html',
  styleUrl: './replay-timeline.component.scss',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayTimelineComponent {
  readonly svc = inject(MarkerReplayService);

  readonly ROW_H = TAPE_ROW_H;

  /**
   * Whether the frame under the cursor is already frozen into a comparison
   * window — keeps the 📌 here in sync with the live window's header button.
   */
  readonly alreadyPinned = computed(() => {
    const frame = this.svc.currentFrame();
    return !!frame && this.svc.pinnedDetails().some((p) => sameReplayFrame(p.frame, frame));
  });

  private wheelState: WheelState = initialWheelState();

  /** Mid-tape cursor position (px from the scroller's top). */
  private readonly cursorPx = TAPE_VIEWPORT_H / 2;

  // ---- frame tape ----

  /** Frames currently rendered (± viewport/2 + buffer around the cursor). */
  readonly visibleFrames = computed<TapeRow<ReplayFrame>[]>(() => {
    const frames = this.svc.frames();
    if (!this.svc.browsingFrames()) return [];
    const c = this.svc.currentFrameIndex();
    const half = Math.ceil(TAPE_VIEWPORT_H / 2 / TAPE_ROW_H) + SLICE_BUFFER;
    const from = Math.max(0, c - half);
    const to = Math.min(frames.length, c + half + 1);
    const rows: TapeRow<ReplayFrame>[] = [];
    for (let i = from; i < to; i++) rows.push({ index: i, item: frames[i] });
    return rows;
  });

  // ---- bucket tape ----

  readonly visibleBuckets = computed<TapeRow<{ ts: string; count: number }>[]>(() => {
    if (this.svc.browsingFrames()) return [];
    const buckets = this.svc.buckets();
    const c = this.svc.currentBucketIndex() ?? 0;
    const half = Math.ceil(TAPE_VIEWPORT_H / 2 / TAPE_ROW_H) + SLICE_BUFFER;
    const from = Math.max(0, c - half);
    const to = Math.min(buckets.length, c + half + 1);
    const rows: TapeRow<{ ts: string; count: number }>[] = [];
    for (let i = from; i < to; i++) rows.push({ index: i, item: buckets[i] });
    return rows;
  });

  /** Full-bar reference width (px) for bucket density bars. */
  readonly bucketFullPx = 150;

  private readonly maxBucketCount = computed(() => maxBucketCount(this.svc.buckets()));

  /** Density bar width (px) for one bucket row (template helper). */
  bucketBarWidth(bucket: { count: number }): number {
    return bucketBarWidthFor(bucket.count, this.maxBucketCount(), this.bucketFullPx);
  }

  // ---- geometry ----

  /** Translate keeping the current row centered under the fixed cursor. */
  readonly scrollTransform = computed(() => {
    const idx = this.svc.browsingFrames()
      ? this.svc.currentFrameIndex()
      : this.svc.currentBucketIndex() ?? 0;
    return `translateY(${this.cursorPx - (idx + 0.5) * TAPE_ROW_H}px)`;
  });

  readonly totalTapeHeight = computed(() => {
    const rows = this.svc.browsingFrames() ? this.svc.frames().length : this.svc.buckets().length;
    return Math.max(rows, 1) * TAPE_ROW_H;
  });

  // ---- ticks (adaptive HH:MM:SS rail) ----

  readonly ticks = computed<TimelineTick[]>(() => {
    if (this.svc.browsingFrames()) {
      const frames = this.svc.frames();
      if (frames.length < 2) return [];
      const spanSec = Math.max(1, Math.ceil(Number(frames[frames.length - 1].ts) - Math.floor(Number(frames[0].ts))));
      return ticksFor(frames, chooseTickStep(spanSec));
    }
    const buckets = this.svc.buckets();
    if (buckets.length < 2) return [];
    const spanSec = buckets.length; // one bucket per second by contract
    const every = Math.max(1, Math.round(chooseTickStep(spanSec)));
    const ticks: TimelineTick[] = [];
    for (let i = 0; i < buckets.length; i += every) {
      ticks.push({ index: i, label: formatSeconds(Number(buckets[i].ts)) });
    }
    return ticks.slice(0, 64);
  });

  // ---- cursor label (the ONLY concrete time readout, on the current row) ----

  readonly cursorLabel = computed(() => {
    if (this.svc.browsingFrames()) {
      const frames = this.svc.frames();
      const f = this.svc.currentFrame();
      if (!f) return '';
      return `${formatFrameTime(f.ts)}  ${formatDelta(f.ts, frames[0].ts)}`;
    }
    const bi = this.svc.currentBucketIndex();
    const bucket = bi === null ? null : this.svc.buckets()[bi];
    return bucket ? `${formatFrameTime(bucket.ts)}  ×${bucket.count}` : '';
  });

  // ---- interaction ----

  onWheel(event: WheelEvent): void {
    event.preventDefault(); // keep the map underneath from zooming (element-level, non-passive)
    const maxStep = this.svc.browsingFrames() ? MAX_STEP_FRAMES : MAX_STEP_BUCKETS;
    const { step, state } = stepForWheel(this.wheelState, event.deltaY, performance.now(), maxStep);
    this.wheelState = state;
    if (step !== 0) this.svc.stepBy(step);
  }

  stepBackward(): void {
    this.svc.stepBy(-1);
  }

  stepForward(): void {
    this.svc.stepBy(1);
  }

  jumpTo(frame: ReplayFrame): void {
    this.svc.jumpToBookmark(frame);
  }

  frameTime(ts: string): string {
    return formatFrameTime(ts);
  }
}
