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
import { Subscription } from 'rxjs';
import { select } from 'd3-selection';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';

import { MarkerReplayService, sameReplayFrame } from '@services/marker-replay.service';
import { MapScaleService } from '@services/mapScale.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { PinnedDetail } from '@models/marker-replay';
import { formatDelta, formatFrameTime } from './replay-timeline-math';
import { clusterAppend, DOCK_TILE_H, DOCK_TILE_W, dockSlot, placeWindow, snapRect } from './replay-geometry';
import { ProtocolTreeComponent } from './protocol-tree.component';

/** Leader-line endpoint pair in viewport px (window edge → link anchor). */
interface Leader {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * A frame's detail window — instantiated twice over:
 *  - LIVE (no {@link pinned} input): follows the timeline cursor
 *    (`svc.currentFrame()`), ANCHORED beside its source link with a leader
 *    line (dot at the link end — a "this window describes this link" callout,
 *    never a traffic arrow), plus a 📌 button that freezes the current frame
 *    into a pinned snapshot;
 *  - PINNED ({@link pinned} set): a frozen comparison snapshot (Wireshark's
 *    "open packet in a new window") showing the cross-window diff
 *    ({@link changedPaths}). A NEW snapshot joins the user's hand-arranged
 *    cluster when one exists ({@link clusterAppend} — flush beside the
 *    arranged windows, so arrange the first and later pins stack up next to
 *    it); otherwise it DOCKS in the deterministic bottom comparison row
 *    ({@link dockSlot} — uniform tiles, left→right, wrapping upward). The
 *    header's link chip identifies the hop.
 *
 * Reposition triggers: a MutationObserver on `g.canvas`'s transform attribute
 * (pan rewrites it without emitting ANY event — the zoom directive at least
 * bumps MapScaleService), plus `MapScaleService.scaleChangeEmitter` (toolbar
 * zoom), `MapSettingsService.mapRenderedEmitter` (node drags / data redraws)
 * and window resize — all funnelled into ONE rAF-coalesced reposition pass.
 * Pinned windows also reflow when siblings are pinned/unpinned (index shift).
 *
 * The live anchor uses the link path's bounding-box CENTER in viewport
 * coordinates (`getBoundingClientRect`), so every map transform — including
 * the parallel-link bundle translate — is already applied by the browser.
 *
 * SIZING: the user drag-resizes the window (mwlResizable, the same chrome as
 * marker-manager). Live: the anchoring engine stays authoritative for
 * POSITION — after a resize the window is re-placed with its new size.
 * Pinned: while DOCKED the slot owns both position and size; dragging or
 * resizing frees the window (it keeps the user's spot/size, clamped), and
 * `reanchor()` re-docks it.
 */
@Component({
  selector: 'app-replay-detail-window',
  templateUrl: './replay-detail-window.component.html',
  styleUrl: './replay-detail-window.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ProtocolTreeComponent,
    ResizableDirective,
    ResizeHandleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayDetailWindowComponent implements OnInit, OnDestroy {
  readonly zIndex = input(1000);
  /** Focus stacking boost from the overlay's click-to-front counter. */
  readonly zBoost = input(0);
  /** Set → PINNED mode: the window freezes this snapshot instead of the cursor. */
  readonly pinned = input<PinnedDetail | null>(null);
  /** Cross-window diff paths (pinned mode; null on the live window). */
  readonly changedPaths = input<ReadonlySet<string> | null>(null);
  /** Any mousedown inside the window — the overlay raises it above its siblings. */
  readonly windowFocused = output<void>();

  readonly svc = inject(MarkerReplayService);
  private readonly mapScale = inject(MapScaleService);
  private readonly mapSettings = inject(MapSettingsService);
  private readonly linksDataSource = inject(LinksDataSource);
  private readonly nodesDataSource = inject(NodesDataSource);

  readonly DEFAULT_W = 440;
  readonly DEFAULT_H = 420;
  readonly MIN_W = 320;
  readonly MIN_H = 220;
  /** Fallback position while no anchor has ever resolved (top-right, below toolbar). */
  private readonly FALLBACK = { left: 0, top: 80 };

  /** User-owned window size (drag-resize); placement consumes both. */
  readonly winWidth = signal(this.DEFAULT_W);
  readonly winHeight = signal(this.DEFAULT_H);
  readonly winLeft = signal(this.FALLBACK.left);
  readonly winTop = signal(this.FALLBACK.top);
  /**
   * True once the user has DRAGGED the window: it leaves auto-anchor mode and
   * stays at the dropped spot (clamped to the viewport) while the leader line
   * keeps tracking the link. `reanchor()` snaps back to placed mode. (Distinct
   * from the {@link pinned} INPUT — a frozen comparison snapshot.)
   */
  readonly dragPinned = signal(false);
  /** True while a header drag gesture is in flight. */
  readonly dragging = signal(false);
  /** False when the frame's link is not on the map (deleted) or geometry failed. */
  readonly anchored = signal(false);
  /** Leader line geometry; null while unanchored. */
  readonly leader = signal<Leader | null>(null);
  /** True while a resize gesture is in flight (suppresses anchor re-placement). */
  readonly resizing = signal(false);
  /**
   * Whether this pinned window has had its FIRST placement pass — the join-the
   *-cluster decision only applies to a brand-new window, never to reflows of
   * an already placed one.
   */
  private placed = false;

  /** Type-narrowed views of the detail state for the template. */
  readonly isLive = computed(() => this.pinned() === null);
  /** The frame this window describes: its own snapshot, or the cursor's. */
  readonly activeFrame = computed(() => this.pinned()?.frame ?? this.svc.currentFrame());
  /** Own detail lifecycle in pinned mode; the shared one when live. */
  readonly detailState = computed(() => this.pinned()?.state ?? this.svc.detail());
  /** Live-window 📌 state: disabled once this exact frame is already pinned. */
  readonly alreadyPinned = computed(() => {
    const frame = this.activeFrame();
    return !!frame && this.svc.pinnedDetails().some((p) => sameReplayFrame(p.frame, frame));
  });
  readonly zVal = computed(() => this.zIndex() + this.zBoost());
  readonly detailOk = computed(() => {
    const d = this.detailState();
    return d.status === 'ok' ? d : null;
  });
  readonly detailError = computed(() => {
    const d = this.detailState();
    return d.status === 'error' ? d : null;
  });
  readonly errorMessage = computed(() => {
    const d = this.detailState();
    if (d.status !== 'error') return '';
    if (d.kind === 'unavailable') return 'Frame detail unavailable — tshark is not usable on this server.';
    if (d.kind === 'missing') return 'Frame data is stale — the capture may have been rebuilt.';
    return d.message;
  });

  /** Protocol chain for the crumbs row (ETH › IPV4 › TCP …) once decoded. */
  readonly breadcrumb = computed(() => {
    const ok = this.detailOk();
    // Skip PDML plumbing (`geninfo`) and the capture-metadata `frame` proto —
    // the crumbs are the network-protocol chain, like Wireshark's protocol
    // column (eth:ethertype:ip:icmp).
    return ok
      ? ok.detail.tree
          .filter((n) => n.element === 'proto' && n.name !== 'geninfo' && n.name !== 'frame')
          .map((n) => n.name.toUpperCase())
      : [];
  });

  private observer: MutationObserver | null = null;
  private readonly subs: Subscription[] = [];
  private rafId: number | null = null;
  private rafPending = false;

  constructor() {
    // LIVE frame changes may move to another link — re-anchor. Pinned windows
    // never follow the cursor (their frame is frozen), but the dock row
    // REFLOWS when siblings are pinned/unpinned (index shifts).
    effect(() => {
      if (!this.pinned() && this.svc.currentFrame()) this.requestReposition();
    });
    effect(() => {
      if (this.pinned()) {
        // Reflow on pin/unpin AND on docked↔freed flips (a sibling dragged out
        // of the row re-indexes everyone's dock slots).
        this.svc.pinnedDetails();
        this.svc.dockVersion();
        this.requestReposition();
      }
    });
  }

  ngOnInit(): void {
    // Pan rewrites g.canvas's transform attribute silently; observing it (with
    // zoom also rewriting the same attribute) covers all map movement.
    const canvas = select('svg#map').select<SVGGElement>('g.canvas').node();
    if (canvas && typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => this.requestReposition());
      this.observer.observe(canvas, { attributes: true, attributeFilter: ['transform'] });
    }
    this.subs.push(
      this.mapScale.scaleChangeEmitter.subscribe({ next: () => this.requestReposition() }),
      this.mapSettings.mapRenderedEmitter.subscribe({ next: () => this.requestReposition() })
    );
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize);
    }
    this.requestReposition();
  }

  ngOnDestroy(): void {
    this.teardownDrag();
    this.observer?.disconnect();
    this.observer = null;
    for (const s of this.subs) s.unsubscribe();
    this.subs.length = 0;
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onResize);
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
  }

  private onResize = (): void => this.requestReposition();

  /** Coalesce reposition requests into one animation-frame pass. */
  private requestReposition(): void {
    if (this.rafPending) return;
    this.rafPending = true;
    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(() => {
        this.rafPending = false;
        this.reposition();
      });
    } else {
      // jsdom / test environments without rAF — reposition synchronously.
      this.rafPending = false;
      this.reposition();
    }
  }

  /** Recompute anchor → window placement → leader line. One pass. */
  private reposition(): void {
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const minTop = 64; // project toolbar

    if (!this.isLive()) {
      const pin = this.pinned()!;
      const target = this.svc.userWindowSize() ?? { width: DOCK_TILE_W, height: DOCK_TILE_H };
      if (!this.dragPinned() && !this.placed) {
        // FIRST placement: join the user's hand-arranged cluster (flush beside
        // the arranged windows) when one exists — only otherwise dock.
        const arranged = this.svc.freedPinRects();
        const pos = arranged.length ? clusterAppend(arranged, target, { width: vw, height: vh }) : null;
        if (pos) {
          this.winWidth.set(target.width);
          this.winHeight.set(target.height);
          this.winLeft.set(pos.left);
          this.winTop.set(pos.top);
          this.dragPinned.set(true); // part of the cluster now — stays put
        } else {
          const docked = this.svc.dockedPinIds();
          const idx = docked.indexOf(pin.id);
          const slot = dockSlot(
            idx >= 0 ? idx : docked.length, // not yet reported → next free slot
            idx >= 0 ? docked.length : docked.length + 1,
            { width: vw, height: vh },
            this.svc.userWindowSize() ?? undefined
          );
          this.winLeft.set(slot.left);
          this.winTop.set(slot.top);
          this.winWidth.set(slot.width);
          this.winHeight.set(slot.height);
        }
      } else if (this.dragPinned()) {
        // Freed by drag/resize/join: keep the user's spot, clamped to the viewport.
        this.winLeft.set(Math.min(Math.max(this.winLeft(), 0), Math.max(0, vw - this.winWidth())));
        this.winTop.set(Math.min(Math.max(this.winTop(), minTop), Math.max(minTop, vh - this.winHeight())));
      } else {
        // Already docked: re-slot against the docked-only indices (compacts
        // when a sibling is dragged out of the row, relaxes when it returns).
        const docked = this.svc.dockedPinIds();
        const idx = Math.max(0, docked.indexOf(pin.id));
        const slot = dockSlot(idx, docked.length, { width: vw, height: vh }, this.svc.userWindowSize() ?? undefined);
        this.winLeft.set(slot.left);
        this.winTop.set(slot.top);
        this.winWidth.set(slot.width);
        this.winHeight.set(slot.height);
      }
      this.placed = true;
      this.updateLeader();
      this.reportRect();
      return;
    }

    if (this.dragPinned()) {
      // Pinned by drag: keep the user's spot, just never let it escape the
      // viewport (the browser window may have shrunk underneath it).
      this.winLeft.set(Math.min(Math.max(this.winLeft(), 0), Math.max(0, vw - this.winWidth())));
      this.winTop.set(Math.min(Math.max(this.winTop(), minTop), Math.max(minTop, vh - this.winHeight())));
    } else {
      const frame = this.activeFrame();
      if (!frame) return;
      const anchor = this.linkCenterScreen(frame.link_id);
      if (anchor) {
        const { rect } = placeWindow(anchor, { width: this.winWidth(), height: this.winHeight() }, { width: vw, height: vh, topOffset: 64 });
        this.winLeft.set(rect.left);
        this.winTop.set(rect.top);
      }
    }
    this.updateLeader();
  }

  /**
   * Point the leader at the current link from wherever the window sits —
   * placed OR pinned. The window end attaches to the edge facing the anchor.
   */
  private updateLeader(): void {
    const frame = this.activeFrame();
    if (!frame) return;
    const anchor = this.linkCenterScreen(frame.link_id);
    if (!anchor) {
      // Link not on the map (deleted) — keep the last position, drop the leader.
      this.anchored.set(false);
      this.leader.set(null);
      return;
    }
    this.anchored.set(true);
    const left = this.winLeft();
    const top = this.winTop();
    const attachLeftEdge = anchor.x < left + this.winWidth() / 2;
    this.leader.set({
      x1: attachLeftEdge ? left : left + this.winWidth(),
      y1: top + this.winHeight() / 2,
      x2: anchor.x,
      y2: anchor.y,
    });
  }

  /** Link path bounding-box center in viewport px (browser applies all transforms). */
  private linkCenterScreen(linkId: string): { x: number; y: number } | null {
    const path = select('svg#map')
      .select<SVGGElement>(`g.link[link_id="${linkId}"]`)
      .select<SVGPathElement>('path.ethernet_link, path.serial_link')
      .node();
    if (!path) return null;
    const rect = path.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null; // not rendered
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  // ---- drag-resize (mwlResizable; position stays anchor-owned) ----

  /**
   * Arrow property on purpose: the library invokes the callback as
   * `this.validateResize(…)` with the DIRECTIVE as `this`, so a plain method
   * would read the directive's (missing) MIN_W/MIN_H — its guard would silently
   * never fire.
   */
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
    // Clamp locally — WindowBoundaryService's config is GLOBAL shared state
    // (its 500px minWidth suits marker-manager, not this window).
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const width = Math.min(Math.max(event.rectangle.width || this.winWidth(), this.MIN_W), Math.max(vw - 32, this.MIN_W));
    const height = Math.min(Math.max(event.rectangle.height || this.winHeight(), this.MIN_H), Math.max(vh - 96, this.MIN_H));

    this.winWidth.set(width);
    this.winHeight.set(height);
    this.resizing.set(false);
    // Remember the chosen size for the session — later pins dock at it.
    this.svc.rememberWindowSize(width, height);
    // A docked snapshot owns its size — resizing one frees it (the dock would
    // otherwise snap the size back); the live window re-places with the new
    // size as before.
    if (!this.isLive() && !this.dragPinned()) this.dragPinned.set(true);
    this.requestReposition();
  }

  // ---- manual position (header drag pins, re-anchor releases) ----

  /** In-flight drag teardown, set while a header gesture is active. */
  private cleanupDrag: (() => void) | null = null;

  /**
   * Dragging the header moves the window and, on release, PINS it there
   * (auto-anchor off). A plain header click without movement does not pin.
   */
  onHeaderMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest('button')) return; // buttons click, not drag
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = this.winLeft();
    const startTop = this.winTop();
    const minTop = 64; // project toolbar
    let moved = false;

    const onMove = (ev: MouseEvent): void => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      moved = true;
      const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
      const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
      let nextLeft = startLeft + dx;
      let nextTop = startTop + dy;
      // Pinned windows magnetically snap against their settled siblings —
      // dragging several together builds flush comparison grids.
      const pin = this.pinned();
      if (pin) {
        const snapped = snapRect(
          { left: nextLeft, top: nextTop, width: this.winWidth(), height: this.winHeight() },
          this.svc.pinSiblingRects(pin.id)
        );
        nextLeft = snapped.left;
        nextTop = snapped.top;
      }
      this.winLeft.set(Math.min(Math.max(nextLeft, 0), Math.max(0, vw - this.winWidth())));
      this.winTop.set(Math.min(Math.max(nextTop, minTop), Math.max(minTop, vh - this.winHeight())));
      this.updateLeader();
    };
    const onUp = (): void => {
      this.teardownDrag();
      this.dragging.set(false);
      if (moved) this.dragPinned.set(true);
      // Full reposition pass — clamps the dropped spot AND republishes this
      // pinned window's rect so siblings snap against where it LANDED, not
      // where it started.
      this.requestReposition();
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

  /** Snap back to auto-placement — beside its link (live) / into the dock row (pinned). */
  reanchor(): void {
    this.dragPinned.set(false);
    this.requestReposition();
  }

  /** Publish this pinned window's settled rect (+ docked/freed state). */
  private reportRect(): void {
    const pin = this.pinned();
    if (pin) {
      this.svc.reportPinRect(
        pin.id,
        {
          left: this.winLeft(),
          top: this.winTop(),
          width: this.winWidth(),
          height: this.winHeight(),
        },
        !this.dragPinned()
      );
    }
  }

  // ---- pinned-snapshot actions ----

  /** Live window's 📌 — freeze the cursor's frame into a comparison window. */
  pinCurrent(): void {
    this.svc.pinCurrent();
  }

  /** Pinned window's ✕ — drop the snapshot. */
  unpinCurrent(): void {
    const p = this.pinned();
    if (p) this.svc.unpin(p.id);
  }

  /** Pinned window's failed decode — try again. */
  retryCurrentPin(): void {
    const p = this.pinned();
    if (p) this.svc.retryPin(p.id);
  }

  // ---- template helpers ----

  frameTime(ts: string): string {
    return formatFrameTime(ts);
  }

  deltaLabel(ts: string): string {
    const frames = this.svc.frames();
    return frames.length ? formatDelta(ts, frames[0].ts) : '';
  }

  /** Link display name ("A → B", cf. marker-manager's linkName). */
  linkLabel(linkId: string): string {
    const link = this.linksDataSource.get(linkId);
    const nodes = link?.nodes;
    if (!nodes || nodes.length < 2) return linkId.slice(0, 8);
    const src = this.nodesDataSource.get(nodes[0].node_id);
    const dst = this.nodesDataSource.get(nodes[1].node_id);
    if (!src || !dst) return linkId.slice(0, 8);
    return `${src.name} → ${dst.name}`;
  }
}
