import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ResizableModule, ResizeEvent } from 'angular-resizable-element';
import { FloatingWindowResizeHandlesComponent } from '../floating-window/floating-window-resize-handles.component';
import { clampRect, clampWindowSize } from '../floating-window/floating-window-geometry';
import { Subscription } from 'rxjs';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { Node } from '../../cartography/models/node';
import { Compute } from '@models/compute';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ComputeService } from '@services/compute.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { MarkerLegendComponent } from '../project-map/marker-legend/marker-legend.component';

@Component({
  selector: 'app-topology-summary',
  templateUrl: './topology-summary.component.html',
  styleUrl: './topology-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onViewportResize()',
  },
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatSelectModule,
    MatOptionModule,
    MatDividerModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    ResizableModule,
    FloatingWindowResizeHandlesComponent,
    MarkerLegendComponent,
  ],
})
export class TopologySummaryComponent implements OnInit, OnDestroy {
  private nodesDataSource = inject(NodesDataSource);
  private computeService = inject(ComputeService);
  private linksDataSource = inject(LinksDataSource);
  private notificationService = inject(NotificationService);
  private toasterService = inject(ToasterService);
  private nodeConsoleService = inject(NodeConsoleService);
  private mapSettingsService = inject(MapSettingsService);
  private userPreferences = inject(UserPreferencesService);
  private cd = inject(ChangeDetectorRef);
  private document = inject(DOCUMENT);

  @Input() controller: Controller;
  @Input() project: Project;

  @Output() openWebConsoleInline = new EventEmitter<{ node: Node; controller: Controller; project: Project }>();
  @Output() openMarkerManager = new EventEmitter<void>();

  private computesInitialized = false;

  public style = {};
  private subscriptions: Subscription[] = [];
  nodes: Node[] = [];
  filteredNodes: Node[] = [];
  public sortingOrder: string = 'asc';
  startedStatusFilterEnabled: boolean = false;
  suspendedStatusFilterEnabled: boolean = false;
  stoppedStatusFilterEnabled: boolean = false;
  captureFilterEnabled: boolean = false;
  packetFilterEnabled: boolean = false;
  computes: Compute[] = [];
  searchQuery = '';
  selectedNode: Node | null = null;

  /** Selected inspector tab: 0 = Topology, 1 = Markers, 2 = Computes. */
  selectedTabIndex: number = 0;
  isDraggingEnabled: boolean = false;

  ngOnInit() {
    this.subscriptions.push(
      this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
        const selectedNodeId = this.selectedNode?.node_id;
        this.nodes = nodes.map((node) => this.normalizeConsoleHost(node));
        this.selectedNode = selectedNodeId
          ? (this.nodes.find((node) => node.node_id === selectedNodeId) ?? null)
          : null;
        this.applyFilters();
        this.cd.markForCheck();
      })
    );

    this.initializeComputes();
    this.revertPosition();
  }

  private initializeComputes() {
    if (!this.controller || this.computesInitialized) {
      return;
    }

    this.computesInitialized = true;
    this.subscriptions.push(
      this.notificationService.computeCacheUpdated.subscribe((computes) => {
        this.computes = computes;
        this.cd.markForCheck();
      })
    );

    // The notification cache only holds computes that happened to emit a WS
    // event (e.g. a remote compute reconnecting), so it is not guaranteed to
    // contain the full list (the local compute rarely emits events). Always
    // fetch the authoritative list via HTTP; the cache stream provides live
    // updates on top of it.
    this.subscriptions.push(
      this.computeService.getComputes(this.controller).subscribe({
        next: (computes) => {
          this.computes = computes;
          this.notificationService.setInitialComputes(computes);
          this.cd.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load computes';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      })
    );
  }

  private normalizeConsoleHost(node: Node): Node {
    const usesWildcardHost =
      node.console_host === '0.0.0.0' || node.console_host === '0:0:0:0:0:0:0:0' || node.console_host === '::';
    return usesWildcardHost && this.controller?.host ? { ...node, console_host: this.controller.host } : node;
  }

  revertPosition() {
    const viewportWidth = this.document.defaultView?.innerWidth ?? 1280;
    const viewportHeight = this.document.defaultView?.innerHeight ?? 800;

    if (viewportWidth <= 720) {
      const headerHeight = 56;
      this.style = {
        position: 'fixed',
        top: `${headerHeight}px`,
        left: '0px',
        width: `${viewportWidth}px`,
        height: `${Math.max(0, viewportHeight - headerHeight)}px`,
      };
      return;
    }

    const leftPosition = this.userPreferences.getItem('leftPosition');
    const rightPosition = this.userPreferences.getItem('rightPosition');
    const topPosition = this.userPreferences.getItem('topPosition');
    const widthOfWidget = this.userPreferences.getItem('widthOfWidget');
    const heightOfWidget = this.userPreferences.getItem('heightOfWidget');

    if (!topPosition) {
      const compactDensity = this.document.documentElement.dataset['density'] === 'compact';
      this.style = {
        top: compactDensity ? '56px' : '68px',
        right: compactDensity ? '8px' : '16px',
        width: '720px',
        height: '680px',
      };
    } else {
      const minimumWidth = 400;
      const width = Math.min(Math.max(Number(widthOfWidget) || 720, minimumWidth), viewportWidth);
      const height = Math.min(Math.max(Number(heightOfWidget) || 680, 420), viewportHeight);
      const top = Math.min(Math.max(Number(topPosition) || 0, 0), Math.max(0, viewportHeight - height));
      const horizontalPosition =
        leftPosition !== null
          ? { left: `${Math.min(Math.max(Number(leftPosition) || 0, 0), Math.max(0, viewportWidth - width))}px` }
          : { right: `${Math.min(Math.max(Number(rightPosition) || 0, 0), Math.max(0, viewportWidth - width))}px` };

      this.style = {
        position: 'fixed',
        ...horizontalPosition,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    }
  }

  onViewportResize(): void {
    this.revertPosition();
  }

  toggleDragging(value: boolean) {
    this.isDraggingEnabled = value;
  }

  startDraggingFromTabStrip(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (event.button === 0 && target.closest('.mat-mdc-tab-header')) {
      this.toggleDragging(true);
    }
  }

  dragWidget(event: Pick<MouseEvent, 'movementX' | 'movementY'>) {
    const x = Number(event.movementX);
    const y = Number(event.movementY);
    const width = Number(this.style['width'].split('px')[0]);
    const height = Number(this.style['height'].split('px')[0]);
    const viewportWidth = this.document.defaultView?.innerWidth ?? 1280;
    const viewportHeight = this.document.defaultView?.innerHeight ?? 800;
    const top = this.clamp(Number(this.style['top'].split('px')[0]) + y, 0, viewportHeight - height);

    if (this.style['left']) {
      const left = this.clamp(Number(this.style['left'].split('px')[0]) + x, 0, viewportWidth - width);
      this.style = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };

      this.userPreferences.setItem('leftPosition', left.toString());
      this.userPreferences.removeItem('rightPosition');
      this.userPreferences.setItem('topPosition', top.toString());
      this.userPreferences.setItem('widthOfWidget', width.toString());
      this.userPreferences.setItem('heightOfWidget', height.toString());
    } else {
      const right = this.clamp(Number(this.style['right'].split('px')[0]) - x, 0, viewportWidth - width);
      this.style = {
        position: 'fixed',
        right: `${right}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };

      this.userPreferences.setItem('rightPosition', right.toString());
      this.userPreferences.removeItem('leftPosition');
      this.userPreferences.setItem('topPosition', top.toString());
      this.userPreferences.setItem('widthOfWidget', width.toString());
      this.userPreferences.setItem('heightOfWidget', height.toString());
    }
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  private static readonly MIN_WIDTH = 400;
  private static readonly MIN_HEIGHT = 420;

  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < TopologySummaryComponent.MIN_WIDTH ||
        event.rectangle.height < TopologySummaryComponent.MIN_HEIGHT)
    ) {
      return false;
    }
    return true;
  }

  /**
   * LIVE follow (floating-window standard): non-ghost mode applies nothing by
   * itself — the validated rect is mirrored into the widget style on every
   * move, clamped through the shared kit helpers, so the widget tracks the
   * pointer instead of a ghost teleporting on release.
   */
  onResizing(event: ResizeEvent): void {
    this.applyResizedRect(event.rectangle);
    this.cd.markForCheck();
  }

  onResizeEnd(event: ResizeEvent): void {
    // Consume the FULL rectangle — left/top included (the standard's
    // jump-on-release guard).
    const rect = this.applyResizedRect(event.rectangle);

    this.userPreferences.setItem('leftPosition', rect.left.toString());
    this.userPreferences.removeItem('rightPosition');
    this.userPreferences.setItem('topPosition', rect.top.toString());
    this.userPreferences.setItem('widthOfWidget', rect.width.toString());
    this.userPreferences.setItem('heightOfWidget', rect.height.toString());
    this.cd.markForCheck();
  }

  /** Clamp a resize gesture's rectangle and write it into the widget style. */
  private applyResizedRect(rectangle: { left?: number; top?: number; width?: number; height?: number }): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const { width, height } = clampWindowSize(
      rectangle.width ?? Number(this.style['width']?.split('px')[0]) ?? TopologySummaryComponent.MIN_WIDTH,
      rectangle.height ?? Number(this.style['height']?.split('px')[0]) ?? TopologySummaryComponent.MIN_HEIGHT,
      viewport,
      TopologySummaryComponent.MIN_WIDTH,
      TopologySummaryComponent.MIN_HEIGHT
    );
    const clamped = clampRect(
      {
        left: rectangle.left ?? (Number(this.style['left']?.split('px')[0]) || 0),
        top: rectangle.top ?? (Number(this.style['top']?.split('px')[0]) || 0),
        width,
        height,
      },
      viewport,
      0
    );
    this.style = {
      position: 'fixed',
      left: `${clamped.left}px`,
      top: `${clamped.top}px`,
      width: `${clamped.width}px`,
      height: `${clamped.height}px`,
    };
    return clamped;
  }

  onTabSelectionChange(index: number) {
    this.selectedTabIndex = index;
  }

  compareAsc(first: Node, second: Node) {
    return first.name.localeCompare(second.name);
  }

  compareDesc(first: Node, second: Node) {
    return second.name.localeCompare(first.name);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  setSortingOrder() {
    this.applyFilters();
  }

  setSearchQuery(value: string) {
    this.searchQuery = value;
    this.applyFilters();
  }

  applyStatusFilter(filter: string) {
    if (filter === 'started') {
      this.startedStatusFilterEnabled = !this.startedStatusFilterEnabled;
    } else if (filter === 'stopped') {
      this.stoppedStatusFilterEnabled = !this.stoppedStatusFilterEnabled;
    } else if (filter === 'suspended') {
      this.suspendedStatusFilterEnabled = !this.suspendedStatusFilterEnabled;
    }
    this.applyFilters();
  }

  applyCaptureFilter(filter: string) {
    if (filter === 'capture') {
      this.captureFilterEnabled = !this.captureFilterEnabled;
    } else if (filter === 'packet') {
      this.packetFilterEnabled = !this.packetFilterEnabled;
    }
    this.applyFilters();
  }

  applyFilters() {
    let nodes: Node[] = [];

    if (this.startedStatusFilterEnabled) {
      nodes = nodes.concat(this.nodes.filter((n) => n.status === 'started'));
    }

    if (this.stoppedStatusFilterEnabled) {
      nodes = nodes.concat(this.nodes.filter((n) => n.status === 'stopped'));
    }

    if (this.suspendedStatusFilterEnabled) {
      nodes = nodes.concat(this.nodes.filter((n) => n.status === 'suspended'));
    }

    if (!this.startedStatusFilterEnabled && !this.stoppedStatusFilterEnabled && !this.suspendedStatusFilterEnabled) {
      nodes = nodes.concat(this.nodes);
    }

    if (this.captureFilterEnabled) {
      nodes = this.checkCapturing(nodes);
    }

    if (this.packetFilterEnabled) {
      nodes = this.checkPacketFilters(nodes);
    }

    const normalizedQuery = this.searchQuery.trim().toLocaleLowerCase();
    if (normalizedQuery) {
      nodes = nodes.filter((node) => node.name.toLocaleLowerCase().includes(normalizedQuery));
    }

    if (this.sortingOrder === 'asc') {
      this.filteredNodes = [...nodes].sort(this.compareAsc);
    } else {
      this.filteredNodes = [...nodes].sort(this.compareDesc);
    }
  }

  checkCapturing(nodes: Node[]): Node[] {
    const links = this.linksDataSource.getItems();
    const nodesWithCapturing = new Set<string>();

    links.forEach((link) => {
      if (link.capturing) {
        link.nodes.forEach((node) => {
          nodesWithCapturing.add(node.node_id);
        });
      }
    });

    return nodes.filter((node) => nodesWithCapturing.has(node.node_id));
  }

  checkPacketFilters(nodes: Node[]): Node[] {
    const links = this.linksDataSource.getItems();
    const nodesWithPacketFilters = new Set<string>();

    links.forEach((link) => {
      if (Object.values(link.filters ?? {}).some((value) => this.hasActiveFilterValue(value))) {
        link.nodes.forEach((node) => {
          nodesWithPacketFilters.add(node.node_id);
        });
      }
    });

    return nodes.filter((node) => nodesWithPacketFilters.has(node.node_id));
  }

  selectNode(node: Node): void {
    this.selectedNode = node;
  }

  hasConsole(node: Node): boolean {
    return (
      node.console !== null &&
      node.console !== undefined &&
      Boolean(node.console_type) &&
      node.console_type !== 'none'
    );
  }

  canOpenConsole(node: Node | null): boolean {
    if (!node || node.status !== 'started') {
      return false;
    }
    return (
      node.console_type === 'telnet' ||
      node.console_type === 'ssh' ||
      node.console_type === 'vnc' ||
      node.console_type?.startsWith('http') === true
    );
  }

  openConsole(node: Node | null = this.selectedNode): void {
    if (!node) return;
    if (node.status !== 'started') {
      this.toasterService.error('To open console please start the node');
      return;
    }

    if (node.console_type === 'vnc' || (node.console_type && node.console_type.startsWith('http'))) {
      // VNC and HTTP/HTTPS consoles: open an inline web console window in the workspace
      this.openWebConsoleInline.emit({
        node,
        controller: this.controller,
        project: this.project,
      });
      return;
    }

    if (node.console_type !== 'telnet' && node.console_type !== 'ssh') {
      this.toasterService.error(
        `Console type '${node.console_type || 'none'}' is not supported in the embedded console.`
      );
      return;
    }
    this.mapSettingsService.logConsoleSubject.next(true);
    this.nodeConsoleService.openConsoleForNode(node);
  }

  getStatusLabel(status: string): string {
    if (status === 'started') return 'Running';
    if (status === 'stopped') return 'Stopped';
    if (status === 'suspended') return 'Suspended';
    return status || 'Unknown';
  }

  get activeFilterCount(): number {
    return [
      this.startedStatusFilterEnabled,
      this.stoppedStatusFilterEnabled,
      this.suspendedStatusFilterEnabled,
      this.captureFilterEnabled,
      this.packetFilterEnabled,
    ].filter(Boolean).length;
  }

  get connectedComputeCount(): number {
    return this.computes.filter((compute) => compute.connected).length;
  }

  private hasActiveFilterValue(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.some((entry) => entry !== null && entry !== undefined && entry !== '' && entry !== 0);
    }
    return value !== null && value !== undefined && value !== '' && value !== 0 && value !== false;
  }

  getComputeTooltip(compute: Compute): string {
    if (!compute) return '';
    const parts = [
      `Name: ${compute.name || 'N/A'}`,
      `Host: ${compute.host}:${compute.port}`,
      `Connected: ${compute.connected ? 'Yes' : 'No'}`,
      compute.cpu_usage_percent != null ? `CPU: ${compute.cpu_usage_percent.toFixed(1)}%` : null,
      compute.memory_usage_percent != null ? `Memory: ${compute.memory_usage_percent.toFixed(1)}%` : null,
    ].filter(Boolean);
    return parts.join('\n');
  }
}
