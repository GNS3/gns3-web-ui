import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./console-devices-panel.component.scss']
})
export class ConsoleDevicesPanelComponent implements OnInit, OnDestroy {
  @Output() deviceSelected = new EventEmitter<Node>();

  nodes: Node[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private nodesDataSource: NodesDataSource,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to all nodes changes
    this.nodesDataSource.changes.pipe(
      takeUntil(this.destroy$)
    ).subscribe((nodes: Node[]) => {
      this.nodes = nodes.filter(n => n.console_type !== 'none');
      this.cdr.markForCheck();
    });

    // Subscribe to individual node updates
    this.nodesDataSource.itemChanged.pipe(
      takeUntil(this.destroy$)
    ).subscribe((node: Node) => {
      const index = this.nodes.findIndex(n => n.node_id === node.node_id);
      if (index >= 0) {
        this.nodes[index] = node;
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
   * Get status color
   */
  getStatusColor(status: string): string {
    const colorMap = {
      started: '#22c55e',
      starting: '#eab308',
      stopped: '#6b7280',
      suspended: '#f97316',
      errored: '#ef4444'
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
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labelMap = {
      started: 'Running',
      starting: 'Starting',
      stopped: 'Stopped',
      suspended: 'Suspended',
      errored: 'Error'
    };
    return labelMap[status] || 'Unknown';
  }
}
