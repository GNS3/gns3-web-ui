import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';

import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProtocolTreeNode } from '@models/marker-replay';
import { MarkerReplayService, sameReplayFrame } from '@services/marker-replay.service';
import { clampRect } from './replay-geometry';
import { diffTrees } from './replay-tree-diff';
import { ReplayPacketListComponent } from './replay-packet-list.component';
import { ReplayDetailPaneComponent } from './replay-detail-pane.component';
import { ReplayDetailWindowComponent } from './replay-detail-window.component';

/**
 * The marker-replay MAIN window (Wireshark-style): a large floating, draggable,
 * edge-resizable window laid out as
 *
 *     header (tag · matched/total · 📌 · close)
 *     filter bar (display filter — evaluated SERVER-side, 400 inline)
 *     ┌ left: packet list ────┬─ right: packet detail (shared pane) ─┐
 *
 * Pinned comparison windows are rendered OUTSIDE the window div (fixed
 * position, no ancestor clipping/stacking context) exactly as before.
 *
 * z-ORDER: the window registers itself in the focus fleet as `'main'` with a
 * floor of +1 — at 1100×640 it overlaps the pin dock row, and pins render
 * after it in DOM order, so without the floor a never-clicked pin would sit
 * above the main window forever. Any click raises that window above everything.
 */
@Component({
  selector: 'app-marker-replay-overlay',
  templateUrl: './marker-replay-overlay.component.html',
  styleUrl: './marker-replay-overlay.component.scss',
  providers: [MarkerReplayService],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ReplayPacketListComponent,
    ReplayDetailPaneComponent,
    ReplayDetailWindowComponent,
    ResizableDirective,
    ResizeHandleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerReplayOverlayComponent implements OnInit, OnDestroy {
  readonly controller = input.required<Controller>();
  readonly project = input.required<Project>();
  readonly tag = input.required<number>();
  readonly zIndex = input<number>(1000);

  readonly closeWindow = output<void>();
  readonly windowFocused = output<void>();

  readonly svc = inject(MarkerReplayService);

  readonly DEFAULT_W = 1100;
  readonly DEFAULT_H = 640;
  readonly MIN_W = 760;
  readonly MIN_H = 420;
  private readonly DEFAULT_TOP = 80; // below the project toolbar

  readonly winLeft = signal(0);
  readonly winTop = signal(this.DEFAULT_TOP);
  readonly winWidth = signal(this.DEFAULT_W);
  readonly winHeight = signal(this.DEFAULT_H);
  /** True while a header drag gesture is in flight (cursor/UX feedback). */
  readonly dragging = signal(false);
  /** True while a resize gesture is in flight. */
  readonly resizing = signal(false);

  /** Focus fleet: 'main' + 'pin-<id>' → stacking boost; main is floored at 1. */
  private zSeq = 1;
  readonly zAssign = signal<ReadonlyMap<string, number>>(new Map([['main', 1]]));

  readonly mainZ = computed(() => this.zIndex() + Math.max(this.zAssign().get('main') ?? 0, 1));

  /** Whether the frame under the list's cursor is already frozen into a pin. */
  readonly alreadyPinned = computed(() => {
    const frame = this.svc.currentFrame();
    return !!frame && this.svc.pinnedDetails().some((p) => sameReplayFrame(p.frame, frame));
  });

  /** Header count: "N frames" (+"of M" while a filter narrows the list). */
  readonly countLabel = computed(() => {
    const total = this.svc.totalFrames();
    const base = this.svc.appliedFilter() ? `${total} of ${this.svc.totalUnfiltered()}` : `${total}`;
    const suffix = this.svc.inWindow() ? ` · second ${(this.svc.currentBucketIndex() ?? 0) + 1}/${this.svc.buckets().length}` : '';
    // Pluralization follows the LARGER count — "1 of 2 frames".
    const many = (this.svc.appliedFilter() ? this.svc.totalUnfiltered() : total) !== 1;
    return `${base} frame${many ? 's' : ''}${suffix}`;
  });

  /** Cross-window diff over every decoded pin (≥2 → non-empty). */
  readonly pinDiff = computed(() => {
    const trees: ProtocolTreeNode[][] = [];
    for (const p of this.svc.pinnedDetails()) {
      if (p.state.status === 'ok') trees.push(p.state.detail.tree);
    }
    return trees.length >= 2 ? diffTrees(trees) : new Set<string>();
  });

  /** Whether ANY list content is on screen (drives full-spinner vs dimming). */
  readonly hasList = computed(
    () => this.svc.browsingFrames() ? this.svc.frames().length > 0 : this.svc.buckets().length > 0
  );

  constructor() {
    // gate (409) / missing (404) kill the session — the service already
    // toasted the server message; 'unavailable' (501 sharkd) and 'network'
    // render inline instead.
    effect(() => {
      const kind = this.svc.rangeErrorKind();
      if (kind === 'gate' || kind === 'missing') this.closeWindow.emit();
    });
  }

  ngOnInit(): void {
    // First placement: centered horizontally, below the toolbar, clamped into
    // the viewport (jsdom's default 1024×768 exercises the clamp).
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.DEFAULT_W;
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.DEFAULT_H;
    const width = Math.min(this.DEFAULT_W, Math.max(this.MIN_W, vw - 32));
    const height = Math.min(this.DEFAULT_H, Math.max(this.MIN_H, vh - 96));
    const r = clampRect(
      { left: Math.round((vw - width) / 2), top: this.DEFAULT_TOP, width, height },
      { width: vw, height: vh },
      64
    );
    this.winWidth.set(r.width);
    this.winHeight.set(r.height);
    this.winLeft.set(r.left);
    this.winTop.set(r.top);

    this.svc.start(this.controller(), this.project().project_id, this.tag());
  }

  ngOnDestroy(): void {
    this.teardownDrag();
    this.svc.destroy();
  }

  close(): void {
    this.closeWindow.emit();
  }

  // ---- focus fleet (main window + pins) ----

  focusWindow(id: string): void {
    this.onWindowFocus();
    const current = this.zAssign();
    if ((current.get(id) ?? 0) === this.zSeq) return; // already topmost
    this.zSeq++;
    const next = new Map(current);
    next.set(id, this.zSeq);
    this.zAssign.set(next);
  }

  onWindowFocus(): void {
    this.windowFocused.emit();
  }

  // ---- filter bar ----

  onFilterInput(e: Event): void {
    this.svc.filter.set((e.target as HTMLInputElement).value);
  }

  onFilterKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.svc.applyFilter(this.svc.filter());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }

  /** A tree field's filter_expr (from either pane) — apply it to the list. */
  onPaneApplyFilter(expr: string): void {
    this.svc.applyFilter(expr);
  }

  // ---- window drag (header) + resize (mwlResizable) ----

  private cleanupDrag: (() => void) | null = null;

  onHeaderMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest('button, input')) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = this.winLeft();
    const startTop = this.winTop();

    const onMove = (ev: MouseEvent): void => {
      const r = clampRect(
        {
          left: startLeft + (ev.clientX - startX),
          top: startTop + (ev.clientY - startY),
          width: this.winWidth(),
          height: this.winHeight(),
        },
        { width: window.innerWidth, height: window.innerHeight },
        64
      );
      this.winLeft.set(r.left);
      this.winTop.set(r.top);
    };
    const onUp = (): void => {
      this.teardownDrag();
      this.dragging.set(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    this.cleanupDrag = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    this.dragging.set(true);
  }

  private teardownDrag(): void {
    this.cleanupDrag?.();
    this.cleanupDrag = null;
  }

  /** Arrow property on purpose — mwlResizable invokes it with the directive as `this`. */
  readonly validate = (event: ResizeEvent): boolean => {
    const w = event.rectangle.width;
    const h = event.rectangle.height;
    if (w !== undefined && w < this.MIN_W) return false;
    if (h !== undefined && h < this.MIN_H) return false;
    return true;
  };

  onResizeStart(): void {
    this.resizing.set(true);
  }

  onResizeEnd(event: ResizeEvent): void {
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const width = Math.min(Math.max(event.rectangle.width || this.winWidth(), this.MIN_W), Math.max(vw - 32, this.MIN_W));
    const height = Math.min(Math.max(event.rectangle.height || this.winHeight(), this.MIN_H), Math.max(vh - 96, this.MIN_H));
    this.winWidth.set(width);
    this.winHeight.set(height);
    this.resizing.set(false);
    // Never let the grown window hang off the viewport.
    const r = clampRect(
      { left: this.winLeft(), top: this.winTop(), width, height },
      { width: vw, height: vh },
      64
    );
    this.winLeft.set(r.left);
    this.winTop.set(r.top);
  }
}
