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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReplayBucket, ReplayFrame } from '@models/marker-replay';
import { MarkerReplayService } from '@services/marker-replay.service';
import {
  bucketBarWidth as bucketBarWidthFor,
  formatFrameTime,
  formatSeconds,
  maxBucketCount,
} from './replay-timeline-math';

/** Full-bar reference width (px) for the per-second density bars. */
const BUCKET_FULL_PX = 150;

/** Uniform row pitch (px) — MUST match the fixed row heights in the SCSS. */
export const ROW_H = 22;
/** Rows rendered above/below the measured viewport (scroll lookahead). */
const SLICE_BUFFER = 8;
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

/** A bucket row in the render window — time/bar width precomputed. */
interface BucketRow {
  index: number;
  bucket: ReplayBucket;
  time: string;
  width: number;
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
 * and the map-link highlight follow. Truncated tags (>5000 frames, server cap)
 * show one density bar per second instead; clicking one materializes that
 * second into frame rows, and the sticky header grows a back affordance.
 *
 * RENDERING is a manual visible-slice ("windowing"): rows are uniformly
 * pitched ({@link ROW_H}), so only the scroll viewport ±
 * {@link SLICE_BUFFER} rows (plus the cursor's neighborhood, so keyboard
 * stepping can never outrun the window) are ever mounted — top/bottom spacer
 * divs preserve the full scroll height. The DOM stays at ~viewport/ROW_H rows
 * regardless of list length (≤5000 frames full mode; bucket rows otherwise,
 * uncapped). Frame objects come straight from the service, server order
 * authoritative.
 */
@Component({
  selector: 'app-replay-packet-list',
  templateUrl: './replay-packet-list.component.html',
  styleUrl: './replay-packet-list.component.scss',
  imports: [CommonModule, MatProgressSpinnerModule],
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

  private readonly scrollTop = signal(0);
  private readonly viewH = signal(0);

  constructor() {
    this.host.nativeElement.style.setProperty(COLS_VAR, colTemplate(this.colWidths));
    // A NEW list (filter/link/window change) restarts at the top — browsers
    // would otherwise keep the old scroll offset against the replacement.
    effect(() => {
      this.svc.frames();
      this.svc.buckets();
      this.scrollTop.set(0);
      const el = this.scroller?.nativeElement;
      if (el) el.scrollTop = 0;
    });
  }

  ngAfterViewInit(): void {
    // Real browsers: capture the actual viewport height before any scroll
    // happens. jsdom stays 0 → the fallback window applies.
    const el = this.scroller?.nativeElement;
    if (el) this.viewH.set(el.clientHeight);
  }

  ngOnDestroy(): void {
    this.teardownColDrag();
  }

  /** The [from, to) render window: viewport ± buffer, cursor kept inside. */
  private renderWindow(len: number, cursor: number): [number, number] {
    const view = this.viewH() > 0 ? this.viewH() : FALLBACK_VIEW_ROWS * ROW_H;
    const first = Math.max(0, Math.floor(this.scrollTop() / ROW_H) - SLICE_BUFFER);
    const last = Math.min(len, Math.ceil((this.scrollTop() + view) / ROW_H) + SLICE_BUFFER);
    if (cursor >= first && cursor < last) return [first, last];
    // Selection outside the scroll window (keyboard stepped past the edge
    // before the scroll-follow landed): SLIDE to the cursor — stretching the
    // window to span the gap would mount every row in between.
    const half = Math.ceil(view / ROW_H / 2);
    return [Math.max(0, cursor - half - SLICE_BUFFER), Math.min(len, cursor + half + SLICE_BUFFER + 1)];
  }

  /** The mounted frame rows + spacer heights (null while in bucket mode). */
  readonly frameSlice = computed<{ rows: FrameRow[]; top: number; bottom: number } | null>(() => {
    const frames = this.svc.frames();
    if (!this.svc.browsingFrames()) return null;
    const [from, to] = this.renderWindow(frames.length, this.svc.currentFrameIndex());
    const rows: FrameRow[] = [];
    for (let i = from; i < to; i++) {
      rows.push({ index: i, frame: frames[i], time: formatFrameTime(frames[i].ts) });
    }
    return { rows, top: from * ROW_H, bottom: (frames.length - to) * ROW_H };
  });

  /** The mounted bucket rows + spacer heights (null while frame rows show). */
  readonly bucketSlice = computed<{ rows: BucketRow[]; top: number; bottom: number } | null>(() => {
    if (this.svc.browsingFrames()) return null;
    const buckets = this.svc.buckets();
    const [from, to] = this.renderWindow(buckets.length, this.svc.currentBucketIndex() ?? 0);
    const max = maxBucketCount(buckets);
    const rows: BucketRow[] = [];
    for (let i = from; i < to; i++) {
      rows.push({
        index: i,
        bucket: buckets[i],
        // Bucket rows are whole seconds — no µs fraction noise.
        time: formatSeconds(Math.floor(Number(buckets[i].ts))),
        width: bucketBarWidthFor(buckets[i].count, max, BUCKET_FULL_PX),
      });
    }
    return { rows, top: from * ROW_H, bottom: (buckets.length - to) * ROW_H };
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

  /** Keep the freshly selected row on screen (centered landing, tape-style). */
  private scrollSelectionIntoView(index: number): void {
    const el = this.scroller?.nativeElement;
    if (!el) return;
    const top = index * ROW_H;
    if (top < el.scrollTop || top + ROW_H > el.scrollTop + el.clientHeight) {
      el.scrollTop = Math.max(0, top + ROW_H / 2 - el.clientHeight / 2);
    }
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
