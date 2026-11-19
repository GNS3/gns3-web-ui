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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { select } from 'd3-selection';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';

import { MarkerReplayService } from '@services/marker-replay.service';
import { MapScaleService } from '@services/mapScale.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { PinnedDetail } from '@models/marker-replay';
import {
  SnapGuides,
  clampRect,
  clampWindowSize,
  clusterAppend,
  DOCK_TILE_H,
  DOCK_TILE_W,
  dockSlot,
  snapDraggedWindow,
  snapResizedWindow,
} from './replay-geometry';
import { ReplayZoomController } from './replay-zoom';
import { ReplayDetailPaneComponent } from './replay-detail-pane.component';

/** Leader-line endpoint pair in viewport px (window edge → link anchor). */
interface Leader {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * A PINNED comparison window (Wireshark's "open packet in a new window"): a
 * frozen frame snapshot showing the cross-window diff ({@link changedPaths})
 * inside the shared {@link ReplayDetailPaneComponent} body.
 *
 * A NEW snapshot joins the user's hand-arranged cluster when one exists
 * ({@link clusterAppend} — flush beside the arranged windows, so arrange the
 * first and later pins stack up next to it); otherwise it DOCKS in the
 * deterministic bottom comparison row ({@link dockSlot} — uniform tiles,
 * left→right, wrapping upward). The header's link chip identifies the hop.
 *
 * Reposition triggers: a MutationObserver on `g.canvas`'s transform attribute
 * (pan rewrites it without emitting ANY event — the zoom directive at least
 * bumps MapScaleService), plus `MapScaleService.scaleChangeEmitter` (toolbar
 * zoom), `MapSettingsService.mapRenderedEmitter` (node drags / data redraws)
 * and window resize — all funnelled into ONE rAF-coalesced reposition pass.
 * The dock row REFLOWS when siblings are pinned/unpinned (index shift).
 *
 * The leader anchors at the link path's bounding-box CENTER in viewport
 * coordinates (`getBoundingClientRect`), so every map transform — including
 * the parallel-link bundle translate — is already applied by the browser.
 *
 * SIZING: the user drag-resizes the window (mwlResizable). While DOCKED the
 * slot owns both position and size; dragging or resizing frees the window (it
 * keeps the user's spot/size, clamped), and `reanchor()` re-docks it.
 */
@Component({
  selector: 'app-replay-detail-window',
  templateUrl: './replay-detail-window.component.html',
  styleUrl: './replay-detail-window.component.scss',
  imports: [CommonModule, MatIconModule, MatTooltipModule, ReplayDetailPaneComponent, ResizableDirective, ResizeHandleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayDetailWindowComponent implements OnInit, OnDestroy {
  readonly zIndex = input(1000);
  /** Focus stacking boost from the overlay's click-to-front counter. */
  readonly zBoost = input(0);
  /** The frozen snapshot this window shows. */
  readonly pinned = input.required<PinnedDetail>();
  /** Cross-window diff paths (computed by the overlay over every decoded pin). */
  readonly changedPaths = input<ReadonlySet<string> | null>(null);
  /** Any mousedown inside the window — the overlay raises it above its siblings. */
  readonly windowFocused = output<void>();

  readonly svc = inject(MarkerReplayService);
  private readonly mapScale = inject(MapScaleService);
  private readonly mapSettings = inject(MapSettingsService);

  readonly MIN_W = 320;
  readonly MIN_H = 220;

  /** User-owned window size (drag-resize); placement consumes both. */
  readonly winWidth = signal(DOCK_TILE_W);
  readonly winHeight = signal(DOCK_TILE_H);
  readonly winLeft = signal(0);
  readonly winTop = signal(80);
  /**
   * True once the user has DRAGGED the window out of the dock row (or a new
   * pin joined the hand-arranged cluster): it keeps the dropped spot (clamped
   * to the viewport) while the leader line keeps tracking the link.
   * `reanchor()` snaps back to the dock row.
   */
  readonly dragPinned = signal(false);
  /** True while a header drag gesture is in flight. */
  readonly dragging = signal(false);
  /** False when the frame's link is not on the map (deleted) or geometry failed. */
  readonly anchored = signal(false);
  /** Leader line geometry; null while unanchored. */
  readonly leader = signal<Leader | null>(null);
  /** True while a resize gesture is in flight. */
  readonly resizing = signal(false);
  /**
   * This window's content zoom — born at the pin kind's last-used level,
   * then adjusted here without touching any sibling (see replay-zoom.ts).
   */
  readonly zoomCtl = new ReplayZoomController('pin');
  /** Live snap-guide lines while a drag/resize attaches; null when idle. */
  readonly snapGuides = signal<SnapGuides | null>(null);
  /**
   * Whether this window has had its FIRST placement pass — the join-the-cluster
   * decision only applies to a brand-new window, never to reflows of an
   * already placed one.
   */
  private placed = false;

  readonly zVal = computed(() => this.zIndex() + this.zBoost());

  private observer: MutationObserver | null = null;
  private readonly subs: Subscription[] = [];
  private rafId: number | null = null;
  private rafPending = false;
  /**
   * Link viewport anchor resolved for the resize gesture in flight.
   * `undefined` = no gesture (resolve on demand), `null` = the link is not
   * on the map (the leader stays dropped for the whole gesture).
   */
  private resizeAnchor: { x: number; y: number } | null | undefined = undefined;

  constructor() {
    // The dock row REFLOWS when siblings are pinned/unpinned (index shifts)
    // and on docked↔freed flips (a sibling dragged out of the row re-indexes
    // everyone's dock slots). A pin's own frame is frozen — no cursor follows.
    effect(() => {
      this.svc.pinnedDetails();
      this.svc.dockVersion();
      this.requestReposition();
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
    // A reposition means the map may have moved, so a resize anchor cached
    // for the gesture is no longer trustworthy.
    this.resizeAnchor = undefined;
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

  /** Recompute dock/cluster placement → leader line. One pass. */
  private reposition(): void {
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const minTop = 64; // project toolbar
    const pin = this.pinned();

    if (!this.dragPinned() && !this.placed) {
      // FIRST placement: join the user's hand-arranged cluster (flush beside
      // the arranged windows) when one exists — only otherwise dock.
      const target = this.svc.userWindowSize() ?? { width: DOCK_TILE_W, height: DOCK_TILE_H };
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
      const r = clampRect(
        { left: this.winLeft(), top: this.winTop(), width: this.winWidth(), height: this.winHeight() },
        { width: vw, height: vh },
        minTop
      );
      this.winLeft.set(r.left);
      this.winTop.set(r.top);
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
  }

  /**
   * Point the leader at the snapshot's source link from wherever the window
   * sits — docked or freed. The window end attaches to the edge facing the
   * anchor.
   */
  private updateLeader(anchorOverride?: { x: number; y: number } | null): void {
    // Resize gestures pass the anchor resolved once at gesture start; every
    // other caller (initial placement, drag, reposition) resolves it fresh.
    const anchor = anchorOverride !== undefined ? anchorOverride : this.currentLinkAnchor();
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

  /** Anchor of the pinned frame's source link, or null when it is not on the map. */
  private currentLinkAnchor(): { x: number; y: number } | null {
    return this.linkCenterScreen(this.pinned().frame.link_id);
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

  // ---- drag-resize (mwlResizable; position stays dock/cluster-owned) ----

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
    // The link cannot move while the pointer is busy resizing this window:
    // resolve its viewport anchor once for the whole gesture instead of
    // re-querying the DOM on every pointer event (see updateLeader).
    this.resizeAnchor = this.currentLinkAnchor();
    this.resizing.set(true);
  }

  /**
   * LIVE follow: non-ghost mode applies NOTHING by itself (the library only
   * reports), so the validated rect is mirrored into the signals on every
   * move — the window tracks the pointer instead of teleporting on release.
   * The dragged edges magnetize against the fleet + viewport rails, and the
   * leader/report stay live so siblings can already snap against the new
   * shape.
   */
  onResizing(event: ResizeEvent): void {
    this.applyResizeSnap(event); // signals already carry the result
    // `onResizeStart` normally resolved the anchor; a caller that resizes
    // without it (tests, programmatic gestures) gets one lazy lookup, then
    // the same cached anchor for the rest of the gesture.
    if (this.resizeAnchor === undefined) {
      this.resizeAnchor = this.currentLinkAnchor();
    }
    this.updateLeader(this.resizeAnchor);
    this.reportRect();
  }

  /** Mirror + magnetize one live resize rectangle into the signals. */
  private applyResizeSnap(event: ResizeEvent): void {
    const r = event.rectangle;
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const snapped = snapResizedWindow(
      {
        left: r.left ?? this.winLeft(),
        top: r.top ?? this.winTop(),
        width: r.width ?? this.winWidth(),
        height: r.height ?? this.winHeight(),
      },
      event.edges ?? {},
      this.svc.snapSiblingRects({ pinId: this.pinned().id }),
      { width: vw, height: vh },
      64, // project toolbar
      this.MIN_W,
      this.MIN_H
    );
    this.winLeft.set(snapped.rect.left);
    this.winTop.set(snapped.rect.top);
    this.winWidth.set(snapped.rect.width);
    this.winHeight.set(snapped.rect.height);
    this.snapGuides.set(snapped.guides);
  }

  onResizeEnd(event: ResizeEvent): void {
    // Mirror the final rectangle through the SAME magnetic snap the live
    // gesture applied — the library reports the RAW pointer rect here, so
    // taking it verbatim would jump the window off the guide on release.
    // (The full rectangle applies: a left/top-edge drag MOVES those edges.)
    this.applyResizeSnap(event);
    // Clamp locally — WindowBoundaryService's config is GLOBAL shared state
    // (its 500px minWidth suits marker-manager, not this window).
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const { width, height } = clampWindowSize(
      this.winWidth(),
      this.winHeight(),
      { width: vw, height: vh },
      this.MIN_W,
      this.MIN_H
    );

    this.winWidth.set(width);
    this.winHeight.set(height);
    this.resizing.set(false);
    // Release the gesture cache: the reposition below re-resolves the anchor
    // and a later gesture must do the same against the map's current state.
    this.resizeAnchor = undefined;
    this.snapGuides.set(null);
    // Remember the chosen size for the session — later pins dock at it. A
    // docked snapshot owns its size, so resizing one frees it (the dock would
    // otherwise snap the size back).
    this.svc.rememberWindowSize(width, height);
    if (!this.dragPinned()) this.dragPinned.set(true);
    this.requestReposition();
  }

  // ---- manual position (header drag frees, re-anchor re-docks) ----

  /** In-flight drag teardown, set while a header gesture is active. */
  private cleanupDrag: (() => void) | null = null;

  /**
   * Dragging the header moves the window and, on release, FREEs it from the
   * dock row. A plain header click without movement does not free it.
   */
  onHeaderMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest('button, input')) return; // buttons/inputs click, not drag
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
      // Magnetize against the whole settled fleet (other pins, the main
      // window, the peek) AND the viewport rails — dragging several together
      // builds flush comparison grids; the guides make the attach visible.
      const snapped = snapDraggedWindow(
        { left: startLeft + dx, top: startTop + dy, width: this.winWidth(), height: this.winHeight() },
        this.svc.snapSiblingRects({ pinId: this.pinned().id }),
        { width: vw, height: vh },
        minTop
      );
      const r = clampRect(snapped.rect, { width: vw, height: vh }, minTop);
      this.winLeft.set(r.left);
      this.winTop.set(r.top);
      // A guide that clampRect overrode would lie — only show engagements
      // that survived into the final position.
      this.snapGuides.set({
        x: r.left === snapped.rect.left ? snapped.guides.x : null,
        y: r.top === snapped.rect.top ? snapped.guides.y : null,
      });
      this.updateLeader();
    };
    const onUp = (): void => {
      this.teardownDrag();
      this.dragging.set(false);
      this.snapGuides.set(null);
      if (moved) this.dragPinned.set(true);
      // Full reposition pass — clamps the dropped spot AND republishes this
      // window's rect so siblings snap against where it LANDED, not where it
      // started.
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

  /** Snap back into the dock row. */
  reanchor(): void {
    this.dragPinned.set(false);
    this.requestReposition();
  }

  /** Publish this window's settled rect (+ docked/freed state). */
  private reportRect(): void {
    this.svc.reportPinRect(
      this.pinned().id,
      {
        left: this.winLeft(),
        top: this.winTop(),
        width: this.winWidth(),
        height: this.winHeight(),
      },
      !this.dragPinned()
    );
  }

  // ---- snapshot actions ----

  /** ✕ — drop the snapshot. */
  unpinCurrent(): void {
    this.svc.unpin(this.pinned().id);
  }

  /** Failed decode — try again. */
  retryCurrentPin(): void {
    this.svc.retryPin(this.pinned().id);
  }

  /** A tree field's filter expression — re-filters the main list (the pin stays frozen). */
  onPaneApplyFilter(expr: string): void {
    this.svc.applyFilter(expr);
  }

  /** The link chip in a pinned pane — narrows the main list the same way. */
  onPaneApplyLinkFilter(linkId: string): void {
    this.svc.applyLinkFilter(linkId);
  }
}
