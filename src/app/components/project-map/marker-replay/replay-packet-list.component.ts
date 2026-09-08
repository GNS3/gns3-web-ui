import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject } from '@angular/core';
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

/**
 * The Wireshark-style packet list (the replay window's LEFT pane): one row per
 * frame with the classic columns (# / Time / Source → Destination / Protocol /
 * Length / Info), rows colored by the server's Wireshark coloring rules
 * (`bg`/`fg` — runtime DATA colors, inline bindings, never SCSS).
 *
 * Click (or ↑/↓ once a row is focused) selects a frame — the debounced decode
 * and the map-link highlight follow. Truncated tags (>5000 frames, server cap)
 * show one density bar per second instead; clicking one materializes that
 * second into frame rows, and the sticky header grows a back affordance.
 *
 * Rendering is a plain `@for` (≤5000 rows full mode, OnPush + tuple-keyed
 * track); the frame objects themselves come straight from the service, server
 * order authoritative.
 */
@Component({
  selector: 'app-replay-packet-list',
  templateUrl: './replay-packet-list.component.html',
  styleUrl: './replay-packet-list.component.scss',
  imports: [CommonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayPacketListComponent implements OnDestroy {
  readonly svc = inject(MarkerReplayService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Column widths (session-only). `addr: null` = still flexible (its initial
   * minmax form); dragging its grip pins it to a px value. Applied as ONE
   * host-level CSS variable — a drag writes a single style per mousemove and
   * every row's grid follows via inheritance, with zero change detection.
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

  ngOnDestroy(): void {
    this.teardownColDrag();
  }

  private readonly bucketMax = computed(() => maxBucketCount(this.svc.buckets()));

  /** Density bar width (px) for one bucket row (template helper). */
  bucketBarWidth(bucket: ReplayBucket): number {
    return bucketBarWidthFor(bucket.count, this.bucketMax(), BUCKET_FULL_PX);
  }

  frameTime(ts: string): string {
    return formatFrameTime(ts);
  }

  /** Bucket rows are whole seconds — no µs fraction noise. */
  secondTime(ts: string): string {
    return formatSeconds(Math.floor(Number(ts)));
  }

  // The null-on-selected trick is LOAD-BEARING: an inline style always
  // out-ranks the selected row's class, so the Wireshark bg must yield
  // (render null) while the row is selected.

  rowBackground(frame: ReplayFrame, selected: boolean): string | null {
    return !selected && frame.bg ? `#${frame.bg}` : null;
  }

  rowColor(frame: ReplayFrame, selected: boolean): string | null {
    return !selected && frame.fg ? `#${frame.fg}` : null;
  }

  /** Stable per-frame track key — the identity tuple (ts alone is NOT unique). */
  trackFrame(_i: number, f: ReplayFrame): string {
    return `${f.ts}\x00${f.node_id}\x00${f.link_id}\x00${f.marker}\x00${f.frame_number}`;
  }

  /** ↑/↓ on a focused row steps the selection (Wireshark's list navigation). */
  onRowKey(e: KeyboardEvent, index: number): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.svc.setCurrentIndex(index + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.svc.setCurrentIndex(index - 1);
    }
  }

  // ---- column resize (header grips; Wireshark's draggable separators) ----

  /**
   * Start dragging a column's right-edge grip. The live width is written as
   * the host CSS variable ({@link COLS_VAR}) — one imperative style write per
   * mousemove; header and rows re-grid via inheritance, no CD storm over the
   * up-to-5000 rows.
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
      this.applyColTemplate();
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

  private applyColTemplate(): void {
    const w = this.colWidths;
    const flex = (v: number | null) => (v === null ? ADDR_FLEX : `${v}px`);
    this.host.nativeElement.style.setProperty(
      COLS_VAR,
      `${w.time}px ${flex(w.src)} ${flex(w.dst)} ${w.proto}px ${w.len}px minmax(110px, 2fr)`
    );
  }
}
