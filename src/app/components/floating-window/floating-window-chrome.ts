/**
 * The floating-window skill's interaction controller: ONE implementation of
 * live resize, header drag, viewport clamping and gesture state for every
 * floating window. A window instantiates it with its OWN minimums and
 * default placement, binds the template to its signals, and deletes its
 * private clone of this logic (see `.claude/skills/gns3-floating-window`).
 *
 *   readonly chrome = new FloatingWindowChrome(
 *     { minWidth: 560, minHeight: 400, defaultRect: {...} },
 *     inject(DestroyRef)
 *   );
 *
 * Contract highlights (the skill has the full rationale):
 * - `enableGhostResize` is ALWAYS false; `onResizing` mirrors the validated
 *   rectangle into the signals on every move so the window tracks the pointer
 *   instead of teleporting on release.
 * - `onResizeEnd` consumes the FULL rectangle — left/top included.
 * - Minimums are per-window parameters, never a shared/global config.
 * - Windows anchored to the right/bottom (ai-chat, console-wrapper) drive
 *   left/top during the gesture and re-derive their anchor from the returned
 *   final rect when persisting.
 */

import { computed, signal, WritableSignal, DestroyRef } from '@angular/core';
import { ResizeEvent } from 'angular-resizable-element';
import { Rect, clampRect, clampWindowSize } from './floating-window-geometry';

export interface FloatingWindowConfig {
  /** The window's OWN minimum size — resize validation and clamping agree on it. */
  minWidth: number;
  minHeight: number;
  /** Optional own maximums (e.g. wireshark's 1920×1080 cap). Must stay ≥ the minimums. */
  maxWidth?: number;
  maxHeight?: number;
  /** Default placement; also the fallback when restore data is unusable. */
  defaultRect: Rect;
  /** Never rides above this y (project-toolbar clearance). May read live. */
  topOffset?: number | (() => number);
}

export class FloatingWindowChrome {
  readonly left: WritableSignal<number>;
  readonly top: WritableSignal<number>;
  readonly width: WritableSignal<number>;
  readonly height: WritableSignal<number>;

  readonly dragging = signal(false);
  readonly resizing = signal(false);
  /** Set by the first user resize — kills "fit content" auto-height modes. */
  readonly userResized = signal(false);

  readonly rect = computed<Rect>(() => ({
    left: this.left(),
    top: this.top(),
    width: this.width(),
    height: this.height(),
  }));

  /** Ready-to-bind `[ngStyle]` object for windows that prefer one binding. */
  readonly styleObject = computed(() => ({
    position: 'fixed',
    left: `${this.left()}px`,
    top: `${this.top()}px`,
    width: `${this.width()}px`,
    height: `${this.height()}px`,
  }));

  private readonly config: FloatingWindowConfig;
  private cleanupDrag: (() => void) | null = null;
  /** Rect when the live resize began — a gesture that ends on it changed nothing. */
  private gestureStartRect: Rect | null = null;
  private readonly onBrowserResize = (): void => this.clampToViewport();

  constructor(config: FloatingWindowConfig, destroyRef?: DestroyRef) {
    this.config = config;
    const seeded = this.constrain(config.defaultRect);
    this.left = signal(seeded.left);
    this.top = signal(seeded.top);
    this.width = signal(seeded.width);
    this.height = signal(seeded.height);
    if (destroyRef) {
      destroyRef.onDestroy(() => this.destroy());
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.onBrowserResize, { passive: true });
      }
    }
  }

  /** Placement/restore: size- and position-clamped in one step. */
  place(rect: Rect): void {
    const r = this.constrain(rect);
    this.left.set(r.left);
    this.top.set(r.top);
    this.width.set(r.width);
    this.height.set(r.height);
  }

  /** Re-clamp into the (possibly changed) viewport — browser-resize handler. */
  clampToViewport(): void {
    this.place(this.rect());
  }

  /**
   * Arrow property on purpose — mwlResizable invokes validators with the
   * directive as `this`, so a method would read the wrong fields.
   */
  readonly validate = (event: ResizeEvent): boolean => {
    const w = event.rectangle.width;
    const h = event.rectangle.height;
    if (w !== undefined && w < this.config.minWidth) return false;
    if (h !== undefined && h < this.config.minHeight) return false;
    if (w !== undefined && this.config.maxWidth !== undefined && w > this.config.maxWidth) return false;
    if (h !== undefined && this.config.maxHeight !== undefined && h > this.config.maxHeight) return false;
    return true;
  };

  onResizeStart(): void {
    this.gestureStartRect = this.rect();
    this.resizing.set(true);
  }

  /**
   * LIVE follow: non-ghost mode applies nothing by itself (the library only
   * reports), so the validated rect is mirrored into the signals on every
   * move — clamped through the same helpers resizeEnd uses, so the gesture
   * can never end somewhere the live window wasn't.
   */
  onResizing(event: ResizeEvent): void {
    const r = event.rectangle;
    const rect = this.constrain({
      left: r.left ?? this.left(),
      top: r.top ?? this.top(),
      width: r.width ?? this.width(),
      height: r.height ?? this.height(),
    });
    this.left.set(rect.left);
    this.top.set(rect.top);
    this.width.set(rect.width);
    this.height.set(rect.height);
  }

  /**
   * Consume the FULL rectangle — left/top too: a left/top-edge drag MOVES
   * those edges, and dropping them would snap the window back and grow it
   * toward the opposite side (the jump-on-release bug). Returns the final
   * clamped rect for the host's persistence/anchor derivation.
   */
  onResizeEnd(event: ResizeEvent): Rect {
    const start = this.gestureStartRect;
    const r = event.rectangle;
    // mwlResizable also ends a gesture that never moved (a bare handle
    // mousedown reports the starting rect). Recognizing that BEFORE the
    // mirror matters: the live clamp can push a content-fit height up to the
    // window minimum, which would read as "changed" and permanently kill the
    // auto-height on a stray click.
    const unchanged =
      !!start &&
      (r.width === undefined || Math.abs(r.width - start.width) < 1) &&
      (r.height === undefined || Math.abs(r.height - start.height) < 1);
    if (unchanged) {
      // Restore the raw pre-gesture signals — NOT place(): the seed of a
      // content-fit window may sit below the minimum, and the clamp would
      // rewrite it. Fit mode owns the rendered height there anyway.
      this.left.set(start.left);
      this.top.set(start.top);
      this.width.set(start.width);
      this.height.set(start.height);
    } else {
      this.onResizing(event);
      this.userResized.set(true);
    }
    this.gestureStartRect = null;
    this.resizing.set(false);
    return this.rect();
  }

  /**
   * Header-drag entry point (mousedown on the drag strip ONLY — the action
   * zone never drags). Self-contained document listeners, cleaned up on
   * mouseup or destroy.
   */
  beginDrag(event: MouseEvent): void {
    if (this.dragging()) return;
    // Defense-in-depth for the header split: buttons/inputs never start a
    // drag, even if a host binds this on a wider strip than the title zone.
    if ((event.target as HTMLElement | null)?.closest('button, input, textarea, select')) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = this.left();
    const startTop = this.top();
    let last = event;

    const apply = (): void => {
      const rect = clampRect(
        {
          left: startLeft + (last.clientX - startX),
          top: startTop + (last.clientY - startY),
          width: this.width(),
          height: this.height(),
        },
        this.viewport(),
        this.resolveTopOffset()
      );
      this.left.set(rect.left);
      this.top.set(rect.top);
    };
    const onMove = (e: MouseEvent): void => {
      last = e;
      apply();
    };
    const onUp = (): void => {
      this.cleanupDrag?.();
      this.dragging.set(false);
    };
    // A release can be LOST (Alt-Tab, an OS dialog takes the mouse): without
    // these the gesture would stay live, the mousemove listener would keep
    // moving the window with no button held, and hosts would keep their
    // content pointer-events disabled.
    const onBlur = (): void => onUp();
    const onPointerCancel = (): void => onUp();
    this.cleanupDrag = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('pointercancel', onPointerCancel);
      this.cleanupDrag = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('pointercancel', onPointerCancel);
    this.dragging.set(true);
  }

  destroy(): void {
    this.cleanupDrag?.();
    this.cleanupDrag = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onBrowserResize);
    }
  }

  private viewport(): { width: number; height: number } {
    if (typeof window === 'undefined') {
      // No DOM (SSR): a sane desktop viewport; clamping is best-effort there.
      return { width: 1920, height: 1080 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  }

  private resolveTopOffset(): number {
    const offset = this.config.topOffset;
    const value = typeof offset === 'function' ? offset() : (offset ?? 0);
    return Math.max(0, value);
  }

  private constrain(rect: Rect): Rect {
    const { width, height } = clampWindowSize(rect.width, rect.height, this.viewport(), this.config.minWidth, this.config.minHeight);
    return clampRect(
      {
        ...rect,
        width: this.config.maxWidth !== undefined ? Math.min(width, this.config.maxWidth) : width,
        height: this.config.maxHeight !== undefined ? Math.min(height, this.config.maxHeight) : height,
      },
      this.viewport(),
      this.resolveTopOffset()
    );
  }
}
