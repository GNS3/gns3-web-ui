import { ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MarkerReplayService } from '@services/marker-replay.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DetailState, ReplayFrame, ReplayFrameDetail } from '@models/marker-replay';
import { formatDelta, formatFrameTime } from './replay-timeline-math';
import { linkLabel as formatLinkLabel } from '../helpers/link-label';
import { ProtocolTreeComponent } from './protocol-tree.component';

/**
 * The shared packet-detail BODY (Wireshark's details pane): protocol crumbs,
 * metadata chips and the decoded tree with its state machine. Purely
 * presentational — hosts own the lifecycle:
 *
 *  - the main replay window's RIGHT pane (live: `svc.detail()`,
 *    `svc.currentFrame()`);
 *  - every pinned comparison window (its own frozen frame + detail state).
 *
 * Recovery actions are OUTPUTS so each host decides what "retry"/"recover"
 * means (live: re-fire the pipeline / reload the timeline; a pin: retry its
 * decode / close a stale snapshot). The find-in-packet query stays TWO-WAY
 * bound to the session-shared signal, and the tree's per-row
 * "Apply as filter" clicks bubble upward the same way.
 */
@Component({
  selector: 'app-replay-detail-pane',
  templateUrl: './replay-detail-pane.component.html',
  styleUrl: './replay-detail-pane.component.scss',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, ProtocolTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayDetailPaneComponent {
  /** The frame this pane describes (the live cursor's, or a pin's frozen one). */
  readonly frame = input.required<ReplayFrame>();
  /** The detail lifecycle to render (live: shared; pin: its own). */
  readonly state = input.required<DetailState>();
  /** Cross-window diff paths; null when there is nothing to compare against. */
  readonly changedPaths = input<ReadonlySet<string> | null>(null);
  /** Stale-ts (404) recovery: reload the timeline (live) or close the snapshot (pin). */
  readonly missingAction = input<'reload' | 'close'>('reload');
  /**
   * The previous successful decode (live host only). While the next frame
   * decodes, its tree keeps rendering DIMMED instead of the pane flashing
   * through the loading spinner — the tree component stays mounted, so the
   * toolbar and search state do not flicker either.
   */
  readonly holdDetail = input<ReplayFrameDetail | null>(null);
  /**
   * Forwarded to the tree: unfold every protocol layer on a new decode, the
   * capture-metadata `frame` proto excepted. The peek window opts in — a
   * browsing pane keeps Wireshark's collapsed default.
   */
  readonly autoExpand = input(false);
  /**
   * ts of the list's first row — the delta chip's baseline. Pin hosts pass
   * their FROZEN baseline ({@link PinnedDetail.listStartTs}); a live host may
   * omit it and the session list's first row is used (the live delta is
   * SUPPOSED to follow filters/window moves).
   */
  readonly baselineTs = input<string | null>(null);

  /** Shared find-in-packet query — bound to the session signal at every host. */
  readonly searchQuery = model('');
  /** Re-fire the decode (live pipeline or the pin's own). */
  readonly retry = output<void>();
  /** Stale-ts recovery (host decides: reload timeline / unpin). */
  readonly reload = output<void>();
  /** A tree field's ready-made display filter (Wireshark's Apply as Filter). */
  readonly applyFilter = output<string>();
  /** The link chip's pick — narrow the list to this frame's capture link. */
  readonly applyLinkFilter = output<string>();

  private readonly svc = inject(MarkerReplayService);
  private readonly linksDataSource = inject(LinksDataSource);
  private readonly nodesDataSource = inject(NodesDataSource);

  readonly detailError = computed(() => {
    const d = this.state();
    return d.status === 'error' ? d : null;
  });
  /** What the tree area renders: the fresh decode, else the held one mid-flight. */
  readonly shownDetail = computed<ReplayFrameDetail | null>(() => {
    const s = this.state();
    if (s.status === 'ok') return s.detail;
    return s.status === 'loading' ? this.holdDetail() : null;
  });
  readonly errorMessage = computed(() => {
    const d = this.state();
    if (d.status !== 'error') return '';
    if (d.kind === 'unavailable') return 'Frame detail unavailable — the sharkd engine is not usable on this server.';
    if (d.kind === 'missing') return 'Frame data is stale — the capture may have been rebuilt.';
    return d.message;
  });
  readonly missingLabel = computed(() => (this.missingAction() === 'close' ? 'Close' : 'Reload timeline'));

  /** Protocol chain for the crumbs row (ETH › IPV4 › TCP …) — follows the SHOWN tree. */
  readonly breadcrumb = computed(() => {
    const d = this.shownDetail();
    // Skip plumbing (`geninfo`) and the capture-metadata `frame` proto — the
    // crumbs are the network-protocol chain, like Wireshark's protocol column.
    return d
      ? d.tree
          .filter((n) => n.element === 'proto' && n.name !== 'geninfo' && n.name !== 'frame')
          .map((n) => n.name.toUpperCase())
      : [];
  });

  frameTime(ts: string): string {
    return formatFrameTime(ts);
  }

  deltaLabel(ts: string): string {
    const base = this.baselineTs() ?? this.svc.frames()[0]?.ts;
    return base ? formatDelta(ts, base) : '';
  }

  /** Link display name ("A → B") — the shared cartography join. */
  linkLabel(linkId: string): string {
    return formatLinkLabel(linkId, this.linksDataSource, this.nodesDataSource);
  }
}
