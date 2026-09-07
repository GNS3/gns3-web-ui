import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReplayBucket, ReplayFrame } from '@models/marker-replay';
import { MarkerReplayService } from '@services/marker-replay.service';
import { bucketBarWidth as bucketBarWidthFor, formatFrameTime, maxBucketCount } from './replay-timeline-math';

/** Full-bar reference width (px) for the per-second density bars. */
const BUCKET_FULL_PX = 150;

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
export class ReplayPacketListComponent {
  readonly svc = inject(MarkerReplayService);

  private readonly bucketMax = computed(() => maxBucketCount(this.svc.buckets()));

  /** Density bar width (px) for one bucket row (template helper). */
  bucketBarWidth(bucket: ReplayBucket): number {
    return bucketBarWidthFor(bucket.count, this.bucketMax(), BUCKET_FULL_PX);
  }

  frameTime(ts: string): string {
    return formatFrameTime(ts);
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

  /** `src → dst` cell text — addresses may be absent (non-IP frames fall back to MAC; some to nothing). */
  addressLabel(frame: ReplayFrame): string {
    return `${frame.src ?? '—'} → ${frame.dst ?? '—'}`;
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
}
