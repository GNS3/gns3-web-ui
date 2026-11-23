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
import { ResizeEvent, ResizableDirective } from 'angular-resizable-element';
import { FloatingWindowResizeHandlesComponent } from '../../floating-window/floating-window-resize-handles.component';

import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProtocolTreeNode, ReplayFrame } from '@models/marker-replay';
import { MarkerReplayService, sameReplayFrame } from '@services/marker-replay.service';
import { WindowManagementService } from '@services/window-management.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { linkLabel as formatLinkLabel } from '../helpers/link-label';
import { SnapGuides, clampRect, clampWindowSize, snapDraggedWindow, snapResizedWindow } from './replay-geometry';
import { ReplayZoomController } from './replay-zoom';
import { ReplayWindowStore } from './replay-window-state';
import { diffTrees } from './replay-tree-diff';
import { FrameContextMenuRequest, ReplayPacketListComponent } from './replay-packet-list.component';
import { ReplayDetailPaneComponent } from './replay-detail-pane.component';
import { ReplayDetailWindowComponent } from './replay-detail-window.component';
import { ReplayPeekWindowComponent } from './replay-peek-window.component';

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
/**
 * The z band project-map grants each raised floating window: its raises step
 * WHOLE bands (base + n × band), and this overlay's internal focus fleet
 * keeps its boosts inside [0, band) — so a window raised at the project-map
 * level is guaranteed above every internal boost of every other window,
 * while the internal click-to-front still reorders freely within the band.
 */
export const REPLAY_WINDOW_Z_BAND = 100;

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
    ReplayPeekWindowComponent,
    ResizableDirective,
    FloatingWindowResizeHandlesComponent,
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
  private readonly prefs = inject(UserPreferencesService);
  /** Main-window geometry persistence (profile-synced via the prefs facade). */
  private readonly windowStore = new ReplayWindowStore(
    (key) => this.prefs.getItem(key),
    (key, value) => this.prefs.setItem(key, value)
  );

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
  /** The main window's content zoom (see replay-zoom.ts — per-kind default,
   * persisted through the prefs facade so it follows the account). */
  readonly zoomCtl = new ReplayZoomController(
    'main',
    (key) => this.prefs.getItem(key),
    (key, value) => this.prefs.setItem(key, value)
  );
  /** Live snap-guide lines while a drag/resize attaches; null when idle. */
  readonly snapGuides = signal<SnapGuides | null>(null);

  /**
   * Packet-row context menu (right-click over a row, or Shift+F10 on a
   * focused row). Anchored in VIEWPORT coordinates and rendered in the
   * window chrome OUTSIDE the zoomed panes — the row's raw clientX/clientY
   * must not be scaled by the content zoom.
   */
  readonly rowMenu = signal<{ frame: ReplayFrame; x: number; y: number } | null>(null);

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
      // The snap fleet only tracks VISIBLE windows — a minimized window's
      // rect would be a ghost nothing may magnetize against.
      if (isMin) this.svc.clearWindowRect('main');
      else this.reportMainRect();
    });
    // A peek is BORN over the window that spawned it — raise it in the focus
    // fleet on every birth. Keyed on seq: decode updates for the SAME peek
    // must not re-raise it (the user may have clicked elsewhere since).
    let lastPeekSeq = 0;
    effect(() => {
      const seq = this.svc.peek()?.seq ?? 0;
      if (seq === lastPeekSeq) return;
      lastPeekSeq = seq;
      if (seq > 0) this.focusWindow('peek');
    });
  }

  ngOnInit(): void {
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.DEFAULT_W;
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.DEFAULT_H;
    // Placement: the user's LAST arrangement when one is persisted
    // (profile-synced — re-clamped against the CURRENT viewport/min sizes so
    // a 4K-desktop layout degrades safely on a laptop), else the default:
    // centered horizontally below the toolbar (jsdom's 1024×768 exercises
    // the clamp).
    const saved = this.windowStore.load().main;
    let width: number;
    let height: number;
    let left: number;
    let top: number;
    if (saved) {
      const size = clampWindowSize(saved.width, saved.height, { width: vw, height: vh }, this.currentMinW(), this.MIN_H);
      width = size.width;
      height = size.height;
      left = saved.left;
      top = saved.top;
    } else {
      width = Math.min(this.DEFAULT_W, Math.max(this.OPEN_MIN_W, vw - 32));
      height = Math.min(this.DEFAULT_H, Math.max(this.MIN_H, vh - 96));
      left = Math.round((vw - width) / 2);
      top = this.DEFAULT_TOP;
    }
    const r = clampRect({ left, top, width, height }, { width: vw, height: vh }, 64);
    this.winWidth.set(r.width);
    this.winHeight.set(r.height);
    this.winLeft.set(r.left);
    this.winTop.set(r.top);
    this.reportMainRect();

    if (typeof window !== 'undefined') window.addEventListener('resize', this.onViewportResize);

    this.svc.start(this.controller(), this.project().project_id, this.tag());
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onViewportResize);
    this.teardownDrag();
    this.svc.clearWindowRect('main');
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
    // The fleet's boosts must stay inside [0, REPLAY_WINDOW_Z_BAND): an
    // unbounded internal counter would eventually eat the next cross-window
    // raise (project-map steps WHOLE bands), so on band exhaustion the fleet
    // RENUMBERS 1..k preserving relative order — the classic z-array compaction.
    let base = current;
    if (this.zSeq >= REPLAY_WINDOW_Z_BAND - 1) {
      const ordered = [...current.entries()].sort((a, b) => a[1] - b[1]);
      base = new Map(ordered.map(([k], i) => [k, i + 1] as [string, number]));
      this.zSeq = ordered.length;
    }
    this.zSeq++;
    const next = new Map(base);
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

  // ---- packet-row context menu (pin / unpin) -------------------------------

  /**
   * Open the row menu at the pointer. Coordinates arrive in VIEWPORT space
   * (the packet list reports raw clientX/clientY) and are clamped so the
   * single-item menu never hangs off the right/bottom edge.
   */
  openRowMenu(req: FrameContextMenuRequest): void {
    const vw = typeof window === 'undefined' ? req.x + 200 : window.innerWidth;
    const vh = typeof window === 'undefined' ? req.y + 64 : window.innerHeight;
    this.rowMenu.set({
      frame: req.frame,
      x: Math.max(8, Math.min(req.x, vw - 184)),
      y: Math.max(8, Math.min(req.y, vh - 56)),
    });
  }

  closeRowMenu(): void {
    this.rowMenu.set(null);
  }

  /**
   * The menu's single action: pin the target frame, or unpin it when it is
   * already pinned (the row menu's label mirrors this). Closes afterwards.
   */
  toggleRowMenuPin(): void {
    const menu = this.rowMenu();
    if (!menu) return;
    const id = this.svc.pinnedIdFor(menu.frame);
    if (id !== null) this.svc.unpin(id);
    else this.svc.pinFrame(menu.frame);
    this.closeRowMenu();
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
    this.reportMainRect();
    // Persist only the OPEN (wide) shape — the transient list-only width is
    // a per-session layout, not a preference.
    if (this.detailOpen()) this.persistMainRect();
  }

  // ---- viewport tracking ----------------------------------------------------

  /** Publish the settled rect — pins/peek magnetize against the main window. */
  private reportMainRect(): void {
    this.svc.reportWindowRect('main', {
      left: this.winLeft(),
      top: this.winTop(),
      width: this.winWidth(),
      height: this.winHeight(),
    });
  }

  /** Persist the settled rect (profile-synced) — reopen restores it. */
  private persistMainRect(): void {
    this.windowStore.storeMain({
      left: this.winLeft(),
      top: this.winTop(),
      width: this.winWidth(),
      height: this.winHeight(),
    });
  }

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
    this.reportMainRect();
    // The clamped shape is the durable truth — keep the stored rect valid.
    this.persistMainRect();
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
      const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
      const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
      // Magnetize against the settled fleet (pins, the peek) and the viewport
      // rails — the main window joins the same comparison-grid physics.
      const snapped = snapDraggedWindow(
        {
          left: startLeft + (ev.clientX - startX),
          top: startTop + (ev.clientY - startY),
          width: this.winWidth(),
          height: this.winHeight(),
        },
        this.svc.snapSiblingRects({ windowId: 'main' }),
        { width: vw, height: vh },
        64
      );
      const r = clampRect(snapped.rect, { width: vw, height: vh }, 64);
      this.winLeft.set(r.left);
      this.winTop.set(r.top);
      // Only show engagements the clamp let stand (an overridden guide lies).
      this.snapGuides.set({
        x: r.left === snapped.rect.left ? snapped.guides.x : null,
        y: r.top === snapped.rect.top ? snapped.guides.y : null,
      });
    };
    const onUp = (): void => {
      this.teardownDrag();
      this.dragging.set(false);
      this.snapGuides.set(null);
      this.reportMainRect();
      this.persistMainRect();
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

  /**
   * LIVE follow: non-ghost mode applies nothing by itself (the library only
   * reports), so the validated rect is mirrored into the signals on every
   * move — the window tracks the pointer instead of teleporting on release.
   * The dragged edges magnetize against the fleet + viewport rails.
   */
  onResizing(event: ResizeEvent): void {
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
      this.svc.snapSiblingRects({ windowId: 'main' }),
      { width: vw, height: vh },
      64,
      this.currentMinW(),
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
    this.onResizing(event);
    const vw = typeof window !== 'undefined' ? window.innerWidth : this.winWidth();
    const vh = typeof window !== 'undefined' ? window.innerHeight : this.winHeight();
    const { width, height } = clampWindowSize(
      this.winWidth(),
      this.winHeight(),
      { width: vw, height: vh },
      this.currentMinW(),
      this.MIN_H
    );
    this.winWidth.set(width);
    this.winHeight.set(height);
    this.resizing.set(false);
    this.snapGuides.set(null);
    // Never let the grown window hang off the viewport.
    const rect = clampRect(
      { left: this.winLeft(), top: this.winTop(), width, height },
      { width: vw, height: vh },
      64
    );
    this.winLeft.set(rect.left);
    this.winTop.set(rect.top);
    this.reportMainRect();
    this.persistMainRect();
  }
}
