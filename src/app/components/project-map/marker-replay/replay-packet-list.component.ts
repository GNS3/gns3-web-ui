import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReplayFrame } from '@models/marker-replay';
import { MarkerReplayService } from '@services/marker-replay.service';
import { formatFrameTime } from './replay-timeline-math';

/** Uniform row pitch (px) — MUST match the fixed row height in the SCSS. */
export const ROW_H = 22;
/** Rows rendered above the viewport (scroll lookback). */
const SLICE_BUFFER_ABOVE = 8;
/**
 * Rows rendered BELOW the viewport (render-ahead). Generous on purpose: the
 * slice re-renders one CD flush behind the scroll event (zoneless), and a
 * thin band here shows the blank spacer under fast wheel/fling scrolling.
 */
const SLICE_BUFFER_BELOW = 24;
/**
 * Viewport assumed while the scroller is not measurable (jsdom reports 0px
 * clientHeight) — large enough that short fixture lists render whole.
 */
const FALLBACK_VIEW_ROWS = 40;

/** A frame row in the render window — `time` precomputed once per slice. */
interface FrameRow {
  /** Absolute list index (stable while the window slides — the @for key). */
  index: number;
  frame: ReplayFrame;
  time: string;
}

/** Frame columns whose width a header grip can drag (Info flexes last). */
type ResizableCol = 'time' | 'src' | 'dst' | 'proto' | 'len';
/** Drag floors — a column must stay identifiable (Wireshark enforces the same). */
const COL_MIN: Record<ResizableCol, number> = { time: 70, src: 80, dst: 80, proto: 40, len: 34 };
/** Generous drag ceiling so wide address/Info values can be given room. */
const COL_MAX = 600;
/** The address columns start FLEXIBLE; a first drag pins them to px widths. */
const ADDR_FLEX = 'minmax(100px, 1fr)';
/** Host-level CSS variable the header and every row read their grid from. */
const COLS_VAR = '--gns3-replay-cols';

/** Frame-column template for a width set — the ONE definition of the default. */
function colTemplate(w: {
  time: number;
  src: number | null;
  dst: number | null;
  proto: number;
  len: number;
}): string {
  const flex = (v: number | null) => (v === null ? ADDR_FLEX : `${v}px`);
  return `${w.time}px ${flex(w.src)} ${flex(w.dst)} ${w.proto}px ${w.len}px minmax(110px, 2fr)`;
}

/**
 * The Wireshark-style packet list (the replay window's LEFT pane): one row per
 * frame with the classic columns (Time / Source → Destination / Protocol /
 * Length / Info), rows colored by the server's Wireshark coloring rules
 * (`bg`/`fg` — runtime DATA colors bound as row CSS custom properties, never
 * SCSS; the selected row's class out-ranks them by specificity).
 *
 * Click (or ↑/↓ once a row is focused) selects a frame — the debounced decode
 * and the map-link highlight follow. The server sends the FULL list in one
 * response — the client carries the size burden here, not the protocol.
 *
 * RENDERING is a manual visible-slice ("windowing"): rows are uniformly
 * pitched ({@link ROW_H}), so only the scroll viewport ± buffers are ever
 * mounted — top/bottom spacer divs preserve the full scroll height. The DOM
 * stays at ~viewport/ROW_H rows regardless of list length. Frame objects come
 * straight from the service, server order authoritative.
 */
@Component({
  selector: 'app-replay-packet-list',
  templateUrl: './replay-packet-list.component.html',
  styleUrl: './replay-packet-list.component.scss',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayPacketListComponent implements AfterViewInit, OnDestroy {
  readonly svc = inject(MarkerReplayService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Exposed for the template's spacer height math. */
  readonly ROW_H = ROW_H;

  /**
   * Column widths (session-only). `addr: null` = still flexible (its initial
   * minmax form); dragging its grip pins it to a px value. Applied as ONE
   * host-level CSS variable — a drag writes a single style per mousemove and
   * every row's grid follows via inheritance, with zero change detection.
   * The variable is seeded from these defaults at construction, so the SCSS
   * needs no fallback copy of the template (ONE source of truth, here).
   */
  private readonly colWidths: { time: number; src: number | null; dst: number | null; proto: number; len: number } = {
    time: 104,
    src: null,
    dst: null,
    proto: 58,
    len: 42,
  };

  /** In-flight column-drag teardown. */
  private cleanupColDrag: (() => void) | null = null;

  // ---- render window (scroll-driven slice) ----------------------------------

  @ViewChild('scroller') private readonly scroller?: ElementRef<HTMLElement>;

  /** Refreshes {@link viewH} when the scroller itself resizes (window drag). */
  private viewObserver: ResizeObserver | null = null;

  private readonly scrollTop = signal(0);
  private readonly viewH = signal(0);

  constructor() {
    this.host.nativeElement.style.setProperty(COLS_VAR, colTemplate(this.colWidths));
    // A NEW list (filter/link change) restarts at the top — browsers would
    // otherwise keep the old scroll offset against the replacement.
    effect(() => {
      this.svc.frames();
      this.scrollTop.set(0);
      const el = this.scroller?.nativeElement;
      if (el) el.scrollTop = 0;
    });
  }

  ngAfterViewInit(): void {
    // Real browsers: capture the actual viewport height before any scroll
    // happens. jsdom stays 0 → the fallback window applies.
    const el = this.scroller?.nativeElement;
    if (!el) return;
    this.viewH.set(el.clientHeight);
    // The replay window (and the detail-pane toggle) resizes the scroller
    // well after init — a stale viewH under-covers the slice and leaves a
    // blank band at the bottom until the next scroll.
    if (typeof ResizeObserver !== 'undefined') {
      this.viewObserver = new ResizeObserver(() => this.viewH.set(el.clientHeight));
      this.viewObserver.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.viewObserver?.disconnect();
    this.viewObserver = null;
    this.teardownColDrag();
  }

  /**
   * The [from, to) render window — PURELY scroll-driven: the viewport ±
   * buffers, nothing else. Deliberately NO "slide to the cursor" branch:
   * scrolling away from the selection is an explicit look-elsewhere intent —
   * yanking the window back to a stale cursor leaves the scroll position
   * stranded on the blank spacer (the all-white-list bug). Keyboard stepping
   * keeps the cursor covered by syncing {@link scrollTop} itself (see
   * {@link scrollSelectionIntoView}).
   */
  private renderWindow(len: number): [number, number] {
    const view = this.viewH() > 0 ? this.viewH() : FALLBACK_VIEW_ROWS * ROW_H;
    return [
      Math.max(0, Math.floor(this.scrollTop() / ROW_H) - SLICE_BUFFER_ABOVE),
      Math.min(len, Math.ceil((this.scrollTop() + view) / ROW_H) + SLICE_BUFFER_BELOW),
    ];
  }

  /** The mounted frame rows + spacer heights (empty while no list is loaded). */
  readonly frameSlice = computed<{ rows: FrameRow[]; top: number; bottom: number } | null>(() => {
    const frames = this.svc.frames();
    const [from, to] = this.renderWindow(frames.length);
    const rows: FrameRow[] = [];
    for (let i = from; i < to; i++) {
      rows.push({ index: i, frame: frames[i], time: formatFrameTime(frames[i].ts) });
    }
    return { rows, top: from * ROW_H, bottom: (frames.length - to) * ROW_H };
  });

  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    this.scrollTop.set(el.scrollTop);
    this.viewH.set(el.clientHeight);
  }

  // ---- selection -------------------------------------------------------------

  /**
   * ↑/↓ steps the SELECTION (Wireshark's list navigation) — deliberately from
   * the selection, not the focused row: focus does not follow the selection,
   * so stepping from the focused row would stick after one press (the second
   * press recomputes the same target and same-index is a no-op).
   */
  onRowKey(e: KeyboardEvent): void {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const target = this.svc.currentFrameIndex() + (e.key === 'ArrowDown' ? 1 : -1);
    if (this.svc.setCurrentIndex(target)) this.scrollSelectionIntoView(target);
  }

  /**
   * Keep the freshly selected row on screen (centered landing, tape-style).
   * The signal is synced TOGETHER with the scroller offset — the render
   * window covers the cursor on the SAME flush, so keyboard stepping can
   * never outrun the slice.
   */
  private scrollSelectionIntoView(index: number): void {
    const top = index * ROW_H;
    const el = this.scroller?.nativeElement;
    if (el && top >= el.scrollTop && top + ROW_H <= el.scrollTop + el.clientHeight) return; // already visible
    const target = Math.max(0, top + ROW_H / 2 - (el?.clientHeight ?? 0) / 2);
    this.scrollTop.set(target);
    if (el) el.scrollTop = target;
  }

  // ---- column resize (header grips; Wireshark's draggable separators) ----

  /**
   * Start dragging a column's right-edge grip. The live width is written as
   * the host CSS variable ({@link COLS_VAR}) — one imperative style write per
   * mousemove; header and rows re-grid via inheritance, no CD storm over the
   * mounted rows.
   */
  startColDrag(e: MouseEvent, col: ResizableCol): void {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    // A flexible column's live width can only be measured, not derived.
    const cell = (e.currentTarget as HTMLElement).parentElement;
    const numeric = this.colWidths[col];
    const startW = typeof numeric === 'number' ? numeric : cell?.offsetWidth || 150;
    const startX = e.clientX;

    const onMove = (ev: MouseEvent): void => {
      const next = Math.min(Math.max(startW + ev.clientX - startX, COL_MIN[col]), COL_MAX);
      (this.colWidths as Record<ResizableCol, number>)[col] = next;
      this.host.nativeElement.style.setProperty(COLS_VAR, colTemplate(this.colWidths));
    };
    const onUp = (): void => this.teardownColDrag();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    this.cleanupColDrag = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }

  private teardownColDrag(): void {
    this.cleanupColDrag?.();
    this.cleanupColDrag = null;
  }
}
