import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Node } from '../../../cartography/models/node';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';

/**
 * Console Devices Panel Component
 * Displays a list of console-capable devices in the sidebar
 */
@Component({
  selector: 'app-console-devices-panel',
  templateUrl: './console-devices-panel.component.html',
  styleUrl: './console-devices-panel.component.scss',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleDevicesPanelComponent implements OnInit, OnDestroy {
  private nodesDataSource = inject(NodesDataSource);
  private cdr = inject(ChangeDetectorRef);

  @Output() deviceSelected = new EventEmitter<Node>();
  readonly isLightTheme = input<boolean>(false);

  nodes = signal<Node[]>([]);
  collapsed = signal(true);

  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    // Subscribe to all nodes changes
    this.nodesDataSource.changes.pipe(takeUntil(this.destroy$)).subscribe((nodes: Node[]) => {
      // Filter out nodes without console and VNC/HTTP/HTTPS nodes (they use standalone popup windows)
      const filteredNodes = nodes.filter((n) => {
        const noConsole = n.console_type === 'none' || !n.console_type;
        const isVnc = n.console_type === 'vnc';
        const isHttp = n.console_type && n.console_type.startsWith('http');
        return !noConsole && !isVnc && !isHttp;
      });
      this.nodes.set(filteredNodes);
      this.sortNodes();
      this.cdr.markForCheck();
    });

    // Subscribe to individual node updates
    this.nodesDataSource.itemChanged.pipe(takeUntil(this.destroy$)).subscribe((node: Node) => {
      const currentNodes = this.nodes();
      const index = currentNodes.findIndex((n) => n.node_id === node.node_id);
      if (index >= 0) {
        currentNodes[index] = node;
        this.nodes.set([...currentNodes]);
        this.sortNodes();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if device is started
   */
  isDeviceStarted(node: Node): boolean {
    return node.status === 'started';
  }

  /**
   * Sort nodes: started devices first, then by name
   */
  private sortNodes(): void {
    const currentNodes = this.nodes();
    currentNodes.sort((a, b) => {
      // First, sort by status (started first)
      const aStarted = a.status === 'started';
      const bStarted = b.status === 'started';

      if (aStarted && !bStarted) {
        return -1;
      }
      if (!aStarted && bStarted) {
        return 1;
      }

      // Then, sort by name alphabetically
      return a.name.localeCompare(b.name);
    });
    this.nodes.set([...currentNodes]);
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colorMap = {
      started: '#22c55e',
      starting: '#eab308',
      stopped: '#6b7280',
      suspended: '#f97316',
      errored: '#ef4444',
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Handle device click
   */
  onDeviceClick(node: Node): void {
    this.deviceSelected.emit(node);
  }

  /**
   * Toggle panel collapse/expand
   */
  togglePanel(): void {
    this.collapsed.set(!this.collapsed());
    this.cdr.markForCheck();
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labelMap = {
      started: 'Running',
      starting: 'Starting',
      stopped: 'Stopped',
      suspended: 'Suspended',
      errored: 'Error',
    };
    return labelMap[status] || 'Unknown';
  }
}
