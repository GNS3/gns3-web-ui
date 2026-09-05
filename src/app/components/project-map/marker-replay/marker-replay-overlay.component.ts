import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { MarkerReplayService } from '@services/marker-replay.service';
import { ProtocolTreeNode } from '@models/marker-replay';
import { ReplayTimelineComponent } from './replay-timeline.component';
import { ReplayDetailWindowComponent } from './replay-detail-window.component';
import { diffTrees } from './replay-tree-diff';

/**
 * Tag-aggregated replay browser, docked on the right edge of the project map.
 *
 * Hosts the session-scoped {@link MarkerReplayService} (provided here, dies with
 * the overlay — caches and signals are per-session by construction) and shows:
 *  - a vertical timeline tape (frame lines / bucket bars, wheel + ▲▼ stepping),
 *  - the anchored detail window for the current frame (floating near its link).
 *
 * Fatal range errors close the overlay: `gate` (409 — some marker under the tag
 * is still capturing; the service already toasted the server message) and
 * `missing` (404 — the tag no longer has markers). Network errors keep the
 * overlay open with an inline Retry.
 */
@Component({
  selector: 'app-marker-replay-overlay',
  templateUrl: './marker-replay-overlay.component.html',
  styleUrl: './marker-replay-overlay.component.scss',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, ReplayTimelineComponent, ReplayDetailWindowComponent],
  providers: [MarkerReplayService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerReplayOverlayComponent implements OnInit, OnDestroy {
  readonly controller = input.required<Controller>();
  readonly project = input.required<Project>();
  /** The tag whose markers' pcaps aggregate into this timeline. */
  readonly tag = input.required<number>();
  readonly zIndex = input<number>(1000);

  @Output() closeWindow = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();

  readonly svc = inject(MarkerReplayService);

  /**
   * Click-to-front stacking for the window fleet (live + pinned), one counter:
   * every mousedown bumps the window's boost above its siblings. Equal boosts
   * fall back to DOM order (later = above), which puts fresh pins on top.
   */
  private zSeq = 0;
  readonly zAssign = signal<ReadonlyMap<string, number>>(new Map());

  focusWindow(id: string): void {
    const next = new Map(this.zAssign());
    next.set(id, ++this.zSeq);
    this.zAssign.set(next);
    // Also raise the whole overlay vs. other top-level windows (marker-manager).
    this.onWindowFocus();
  }

  /**
   * Cross-window diff over the pinned snapshots' decoded trees, computed ONCE
   * here and fed to every pinned window. With fewer than two decoded pins
   * there is nothing to compare — empty set.
   */
  readonly pinDiff = computed(() => {
    const trees = this.svc
      .pinnedDetails()
      .map((p) => (p.state.status === 'ok' ? p.state.detail.tree : null))
      .filter((t): t is ProtocolTreeNode[] => t !== null);
    return trees.length >= 2 ? diffTrees(trees) : new Set<string>();
  });

  /** Header position label: "frame 12 / 3481" or "second 4 / 91 · 9000 frames". */
  readonly positionLabel = computed(() => {
    if (this.svc.browsingFrames()) {
      const n = this.svc.frames().length;
      const i = this.svc.currentFrameIndex();
      if (this.svc.mode() === 'buckets') {
        return `frame ${i + 1} / ${n} · sec ${(this.svc.currentBucketIndex() ?? 0) + 1}`;
      }
      return `frame ${i + 1} / ${n}`;
    }
    const nb = this.svc.buckets().length;
    const bi = this.svc.currentBucketIndex();
    return bi === null ? '' : `sec ${bi + 1} / ${nb} · ${this.svc.totalFrames()} frames`;
  });

  constructor() {
    // gate/missing are unrecoverable for this session — the service toasted the
    // server message already, so just close.
    effect(() => {
      const kind = this.svc.rangeErrorKind();
      if (kind === 'gate' || kind === 'missing') this.closeWindow.emit();
    });
  }

  ngOnInit(): void {
    this.svc.start(this.controller(), this.project().project_id, this.tag());
  }

  ngOnDestroy(): void {
    this.svc.destroy();
  }

  close(): void {
    this.closeWindow.emit();
  }

  onWindowFocus(): void {
    this.windowFocused.emit();
  }
}
