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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';

import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProtocolTreeNode } from '@models/marker-replay';
import { MarkerReplayService, sameReplayFrame } from '@services/marker-replay.service';
import { WindowManagementService } from '@services/window-management.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { linkLabel as formatLinkLabel } from '../helpers/link-label';
import { clampRect, clampWindowSize } from './replay-geometry';
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
    MatMenuModule,
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
  private readonly windowManagement = inject(WindowManagementService);
  private readonly linksDataSource = inject(LinksDataSource);
  private readonly nodesDataSource = inject(NodesDataSource);

  /** Taskbar/minimize registry id (see {@link minimize}). */
  private readonly WINDOW_ID = 'replay-main';
  /**
   * True while the main window is MINIMIZED (hidden via the taskbar). The
   * component — and with it the session service, the LRU and every PINNED
   * comparison window — stays alive; only the window div unmounts. ✕ remains
   * the full close (session destroyed).
   */
  readonly minimized = signal(false);
  /** Whether the right detail pane shows (session preference, default open). */
  readonly detailOpen = signal(true);

  readonly DEFAULT_W = 1100;
  readonly DEFAULT_H = 640;
  readonly MIN_H = 420;
  /** Min width with BOTH panes visible (the right pane alone needs ~340px). */
  readonly OPEN_MIN_W = 760;
  /** Min width collapsed to the list only — the Wireshark columns fit at ~560. */
  readonly LIST_MIN_W = 560;
  /** Width the window takes when the detail pane hides (list-only). */
  readonly LIST_ONLY_W = 640;
  private readonly DEFAULT_TOP = 80; // below the project toolbar
  /** Width while the detail pane was last OPEN — restored on re-expand. */
  private wideWidth = 0;

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

  /** Header count: "N frames" (+"of M" while a filter/link narrows the list). */
  readonly countLabel = computed(() => {
    const total = this.svc.totalFrames();
    const narrowed = this.svc.appliedFilter() || this.svc.appliedLink();
    const base = narrowed ? `${total} of ${this.svc.totalUnfiltered()}` : `${total}`;
    // Pluralization follows the LARGER count — "1 of 2 frames".
    const many = (narrowed ? this.svc.totalUnfiltered() : total) !== 1;
    return `${base} frame${many ? 's' : ''}`;
  });

  /**
   * Link-picker options: the range response's per-source stats grouped by
   * link (several markers on one link arrive as several entries — counts sum),
   * labeled through the shared cartography join, sorted by label.
   */
  readonly linkOptions = computed(() => {
    const counts = new Map<string, number>();
    for (const s of this.svc.sources()) {
      counts.set(s.link_id, (counts.get(s.link_id) ?? 0) + s.count);
    }
    return [...counts.entries()]
      .map(([link_id, count]) => ({
        link_id,
        count,
        label: formatLinkLabel(link_id, this.linksDataSource, this.nodesDataSource),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  /** The picker button's caption — the applied link's name, or "All links". */
  readonly linkPickLabel = computed(() => {
    const id = this.svc.appliedLink();
    return id ? formatLinkLabel(id, this.linksDataSource, this.nodesDataSource) : 'All links';
  });

  /** Empty-result copy: which narrowing(s) produced zero frames. */
  readonly emptyFiltersLabel = computed(() => {
    const link = this.svc.appliedLink();
    if (this.svc.appliedFilter()) return link ? 'No frames match this filter on this link.' : 'No frames match this filter.';
    return 'No frames captured on this link.';
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
  readonly hasList = computed(() => this.svc.frames().length > 0);

  constructor() {
    // gate (409) / missing (404) kill the session — the service already
    // toasted the server message; 'unavailable' (501 sharkd) and 'network'
    // render inline instead.
    effect(() => {
      const kind = this.svc.rangeErrorKind();
      if (kind === 'gate' || kind === 'missing') this.closeWindow.emit();
    });
    // Taskbar minimize/restore sync (the marker-manager pattern).
    effect(() => {
      const isMin = this.windowManagement.minimizedWindows().some((w) => w.id === this.WINDOW_ID);
      if (isMin !== this.minimized()) this.minimized.set(isMin);
    });
  }

  ngOnInit(): void {
    // First placement: centered horizontally, below the toolbar, clamped into
    // the viewport (jsdom's default 1024×768 exercises the clamp).
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.DEFAULT_W;
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.DEFAULT_H;
    const width = Math.min(this.DEFAULT_W, Math.max(this.OPEN_MIN_W, vw - 32));
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

    if (typeof window !== 'undefined') window.addEventListener('resize', this.onViewportResize);

    this.svc.start(this.controller(), this.project().project_id, this.tag());
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onViewportResize);
    this.teardownDrag();
    this.svc.destroy();
  }

  close(): void {
    this.closeWindow.emit();
  }

  /**
   * Hide the main window to the taskbar (restore from there). Pinned
   * comparison windows keep floating — comparing against the map is exactly
   * what minimizing is FOR.
   */
  minimize(): void {
    this.windowManagement.minimizeWindow(this.WINDOW_ID, 'replay');
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

  /** Mode-dependent minimum width (both panes vs. list only). */
  private currentMinW(): number {
    return this.detailOpen() ? this.OPEN_MIN_W : this.LIST_MIN_W;
  }

  /**
   * Collapse/expand the detail pane. Collapsing NARROWS the window to the
   * list-only width (a full-width window for one list is dead weight over the
   * map); expanding restores the width it had while open. The left edge stays
   * put — the window shrinks/grows to the right (viewport-clamped).
   */
  toggleDetail(): void {
    const open = !this.detailOpen();
    if (open) {
      this.detailOpen.set(true);
      if (this.wideWidth) this.applyWidth(this.wideWidth);
    } else {
      this.wideWidth = this.winWidth();
      this.detailOpen.set(false);
      this.applyWidth(this.LIST_ONLY_W);
    }
  }

  /** Set the window width (mode-min clamped, viewport-clamped, left edge kept). */
  private applyWidth(width: number): void {
    const vw = typeof window !== 'undefined' ? window.innerWidth : width;
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const { width: w } = clampWindowSize(width, this.winHeight(), { width: vw, height: vh }, this.currentMinW(), this.MIN_H);
    this.winWidth.set(w);
    const r = clampRect(
      { left: this.winLeft(), top: this.winTop(), width: w, height: this.winHeight() },
      { width: vw, height: vh },
      64
    );
    this.winLeft.set(r.left);
    this.winTop.set(r.top);
  }

  // ---- viewport tracking ----------------------------------------------------

  private readonly onViewportResize = (): void => this.clampIntoViewport();

  /**
   * Re-clamp when the viewport SHRINKS under the window (devtools opened,
   * rotation): the header is the only drag handle, so without this a smaller
   * viewport could strand the window off-screen with no way back.
   */
  private clampIntoViewport(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { width, height } = clampWindowSize(
      this.winWidth(),
      this.winHeight(),
      { width: vw, height: vh },
      this.currentMinW(),
      this.MIN_H
    );
    const r = clampRect(
      { left: this.winLeft(), top: this.winTop(), width, height },
      { width: vw, height: vh },
      64
    );
    this.winWidth.set(r.width);
    this.winHeight.set(r.height);
    this.winLeft.set(r.left);
    this.winTop.set(r.top);
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
    if (w !== undefined && w < this.currentMinW()) return false;
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
      this.currentMinW(),
      this.MIN_H
    );
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
