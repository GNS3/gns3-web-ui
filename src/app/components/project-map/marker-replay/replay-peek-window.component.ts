import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';

import { MarkerReplayService } from '@services/marker-replay.service';
import { clampRect, clampWindowSize } from './replay-geometry';
import { ReplayDetailPaneComponent } from './replay-detail-pane.component';

/** Birth offset from the double-click point — clear of the cursor itself. */
const OPEN_OFFSET = { x: 14, y: -12 };
/** Toolbar clearance — the header (drag handle) must stay reachable. */
const MIN_TOP = 64;

/**
 * The transient double-click detail window ("peek"): a frame's decode in a
 * pinned-window-looking floater born AT the mouse — for quick inspection,
 * not comparison. Deliberately NOT part of the pin set: nothing docks, no
 * cross-window diff, no pin-cap accounting; ✕/Esc closes, and double-
 * clicking another row RETARGETS this window to the new frame/spot.
 *
 * Geometry: birth size 600×520 (bigger than a dock tile — a peek is meant
 * for reading), clamped into the viewport at birth; afterwards the user
 * owns it (drag/resize). Detail-state updates never move the window — only
 * a frame RETARGET does.
 */
@Component({
  selector: 'app-replay-peek-window',
  templateUrl: './replay-peek-window.component.html',
  styleUrl: './replay-peek-window.component.scss',
  imports: [CommonModule, MatIconModule, MatTooltipModule, ReplayDetailPaneComponent, ResizableDirective, ResizeHandleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayPeekWindowComponent implements OnDestroy {
  readonly svc = inject(MarkerReplayService);

  /** Base stacking order + click-to-front boost (the overlay's focus fleet). */
  readonly zIndex = input(1000);
  readonly zBoost = input(0);
  /** Any mousedown inside the window — the overlay raises it above siblings. */
  readonly windowFocused = output<void>();

  readonly MIN_W = 360;
  readonly MIN_H = 260;
  readonly DEFAULT_W = 600;
  readonly DEFAULT_H = 520;

  readonly winLeft = signal(0);
  readonly winTop = signal(0);
  readonly winWidth = signal(this.DEFAULT_W);
  readonly winHeight = signal(this.DEFAULT_H);
  /** True while a header drag gesture is in flight. */
  readonly dragging = signal(false);
  /** True while a resize gesture is in flight. */
  readonly resizing = signal(false);

  /**
   * Floored above the main window — a peek is born OVER the list it sprang
   * from; any click re-arranges the fleet as usual.
   */
  readonly zVal = computed(() => this.zIndex() + Math.max(this.zBoost(), 2));

  /** The peek session the effect last placed for — state updates keep geometry. */
  private placedSeq = 0;

  constructor() {
    // Every openPeek call is a BIRTH (new seq) — re-place at the new spot,
    // even when it targets the same frame from a different double-click. A
    // decode landing keeps the seq and therefore the geometry the user may
    // already have dragged to.
    effect(() => {
      const p = this.svc.peek();
      if (!p) {
        this.placedSeq = 0;
        return;
      }
      if (p.seq === this.placedSeq) return;
      this.placedSeq = p.seq;
      const vw = typeof window !== 'undefined' ? window.innerWidth : this.DEFAULT_W;
      const vh = typeof window !== 'undefined' ? window.innerHeight : this.DEFAULT_H;
      const { width, height } = clampWindowSize(
        this.DEFAULT_W,
        this.DEFAULT_H,
        { width: vw, height: vh },
        this.MIN_W,
        this.MIN_H
      );
      const r = clampRect(
        { left: p.at.x + OPEN_OFFSET.x, top: p.at.y + OPEN_OFFSET.y, width, height },
        { width: vw, height: vh },
        MIN_TOP
      );
      this.winWidth.set(r.width);
      this.winHeight.set(r.height);
      this.winLeft.set(r.left);
      this.winTop.set(r.top);
    });
  }

  ngOnDestroy(): void {
    this.teardownDrag();
  }

  /**
   * Right-click on the TITLE BAR (the drag-handle strip) closes the peek —
   * the transient window's fast dismiss, on the same strip that already
   * means "this window" rather than its contents. Suppresses the browser
   * menu and stops the event before the map's own context menu sees it.
   */
  onHeaderContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.svc.closePeek();
  }

  // ---- drag (header) + resize (mwlResizable) — the shared window pattern ----

  private cleanupDrag: (() => void) | null = null;

  onHeaderMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest('button, input')) return; // buttons/inputs click, not drag
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = this.winLeft();
    const startTop = this.winTop();

    const onMove = (ev: MouseEvent): void => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
      const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
      const r = clampRect(
        {
          left: startLeft + (ev.clientX - startX),
          top: startTop + (ev.clientY - startY),
          width: this.winWidth(),
          height: this.winHeight(),
        },
        { width: vw, height: vh },
        MIN_TOP
      );
      this.winLeft.set(r.left);
      this.winTop.set(r.top);
    };
    const onUp = (): void => this.teardownDrag();

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
    this.dragging.set(false);
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
    const { width, height } = clampWindowSize(
      event.rectangle.width || this.winWidth(),
      event.rectangle.height || this.winHeight(),
      { width: vw, height: vh },
      this.MIN_W,
      this.MIN_H
    );
    this.winWidth.set(width);
    this.winHeight.set(height);
    this.resizing.set(false);
    const r = clampRect(
      { left: this.winLeft(), top: this.winTop(), width, height },
      { width: vw, height: vh },
      MIN_TOP
    );
    this.winLeft.set(r.left);
    this.winTop.set(r.top);
  }
}
