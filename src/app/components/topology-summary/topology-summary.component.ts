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
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResizeEvent } from 'angular-resizable-element';
import { Subscription } from 'rxjs';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { Node } from '../../cartography/models/node';
import { Compute } from '@models/compute';
import { Project } from '@models/project';
import { ProjectStatistics } from '@models/project-statistics';
import { Controller } from '@models/controller';
import { ComputeService } from '@services/compute.service';
import { ProjectService } from '@services/project.service';
import { ThemeService } from '@services/theme.service';
import { NotificationService, ComputeNotification } from '@services/notification.service';

@Component({
  selector: 'app-topology-summary',
  templateUrl: './topology-summary.component.html',
  styleUrl: './topology-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatTabsModule, MatSelectModule, MatOptionModule, MatDividerModule, MatTooltipModule],
})
export class TopologySummaryComponent implements OnInit, OnDestroy {
  private nodesDataSource = inject(NodesDataSource);
  private projectService = inject(ProjectService);
  private computeService = inject(ComputeService);
  private linksDataSource = inject(LinksDataSource);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() project: Project;

  // Track if computes have been initialized
  private computesInitialized = false;

  @Output() closeTopologySummary = new EventEmitter<boolean>();

  public style = {};
  public styleInside = { height: `280px` };
  private subscriptions: Subscription[] = [];
  projectsStatistics: ProjectStatistics;
  nodes: Node[] = [];
  filteredNodes: Node[] = [];
  public sortingOrder: string = 'asc';
  startedStatusFilterEnabled: boolean = false;
  suspendedStatusFilterEnabled: boolean = false;
  stoppedStatusFilterEnabled: boolean = false;
  captureFilterEnabled: boolean = false;
  packetFilterEnabled: boolean = false;
  computes: Compute[] = [];

  isTopologyVisible: boolean = true;
  isDraggingEnabled: boolean = false;
  isLightThemeEnabled: boolean = false;

  constructor() {}

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.subscriptions.push(
      this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
        this.nodes = nodes;
        this.nodes.forEach((n) => {
          if (n.console_host === '0.0.0.0' || n.console_host === '0:0:0:0:0:0:0:0' || n.console_host === '::') {
            n.console_host = this.controller?.host;
          }
        });
        if (this.sortingOrder === 'asc') {
          this.filteredNodes = nodes.sort(this.compareAsc);
        } else {
          this.filteredNodes = nodes.sort(this.compareDesc);
        }
        // In zoneless mode, we need to mark for check after async updates
        this.cd.markForCheck();
      })
    );

    // Delay initialization to wait for controller and project to be set
    // This is necessary because the component is dynamically loaded
    // and ngOnInit runs before the @Input properties are set
    setTimeout(() => {
      this.initializeComputesAndNotifications();
    }, 0);

    this.revertPosition();
  }

  private initializeComputesAndNotifications() {
    if (!this.controller || !this.project || this.computesInitialized) {
      return;
    }

    this.computesInitialized = true;

    this.projectService.getStatistics(this.controller, this.project.project_id).subscribe((stats) => {
      this.projectsStatistics = stats;
      // In zoneless mode, trigger change detection when async data arrives
      this.cd.markForCheck();
    });

    this.computeService.getComputes(this.controller).subscribe((computes) => {
      this.computes = computes;
      // In zoneless mode, trigger change detection when async data arrives
      this.cd.markForCheck();
    });

    // Connect to WebSocket notifications for real-time compute updates
    this.connectToComputeNotifications();
  }

  revertPosition() {
    let leftPosition = localStorage.getItem('leftPosition');
    let rightPosition = localStorage.getItem('rightPosition');
    let topPosition = localStorage.getItem('topPosition');
    let widthOfWidget = localStorage.getItem('widthOfWidget');
    let heightOfWidget = localStorage.getItem('heightOfWidget');

    if (!topPosition) {
      this.style = { top: '60px', right: '0px', width: '320px', height: '400px' };
    } else {
      this.style = {
        position: 'fixed',
        left: `${+leftPosition}px`,
        right: `${+rightPosition}px`,
        top: `${+topPosition}px`,
        width: `${+widthOfWidget}px`,
        height: `${+heightOfWidget}px`,
      };
    }
  }

  toggleDragging(value: boolean) {
    this.isDraggingEnabled = value;
  }

  dragWidget(event) {
    let x: number = Number(event.movementX);
    let y: number = Number(event.movementY);

    let width: number = Number(this.style['width'].split('px')[0]);
    let height: number = Number(this.style['height'].split('px')[0]);
    let top: number = Number(this.style['top'].split('px')[0]) + y;
    if (this.style['left']) {
      let left: number = Number(this.style['left'].split('px')[0]) + x;
      this.style = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };

      localStorage.setItem('leftPosition', left.toString());
      localStorage.setItem('topPosition', top.toString());
      localStorage.setItem('widthOfWidget', width.toString());
      localStorage.setItem('heightOfWidget', height.toString());
    } else {
      let right: number = Number(this.style['right'].split('px')[0]) - x;
      this.style = {
        position: 'fixed',
        right: `${right}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };

      localStorage.setItem('rightPosition', right.toString());
      localStorage.setItem('topPosition', top.toString());
      localStorage.setItem('widthOfWidget', width.toString());
      localStorage.setItem('heightOfWidget', height.toString());
    }
  }

  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < 290 || event.rectangle.height < 260)
    ) {
      return false;
    }
    return true;
  }

  onResizeEnd(event: ResizeEvent): void {
    this.style = {
      position: 'fixed',
      left: `${event.rectangle.left}px`,
      top: `${event.rectangle.top}px`,
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };

    this.styleInside = {
      height: `${event.rectangle.height - 120}px`,
    };
  }

  toggleTopologyVisibility(value: boolean) {
    this.isTopologyVisible = value;
    this.revertPosition();
  }

  compareAsc(first: Node, second: Node) {
    if (first.name < second.name) return -1;
    return 1;
  }

  compareDesc(first: Node, second: Node) {
    if (first.name < second.name) return 1;
    return -1;
  }

  connectToComputeNotifications() {
    // Connect to global WebSocket for compute notifications
    this.notificationService.connectToComputeNotifications(this.controller);

    // Subscribe to compute notifications for real-time updates
    this.subscriptions.push(
      this.notificationService.computeNotificationEmitter.subscribe((notification: ComputeNotification) => {
        this.handleComputeNotification(notification);
      })
    );
  }

  handleComputeNotification(notification: ComputeNotification) {
    switch (notification.action) {
      case 'compute.created':
        // Add new compute to the list
        this.computes = [...this.computes, notification.event];
        break;
      case 'compute.updated':
        // Update existing compute or add if it doesn't exist
        const existingIndex = this.computes.findIndex((c) => c.compute_id === notification.event.compute_id);
        if (existingIndex !== -1) {
          // Update existing compute
          this.computes = this.computes.map((c) =>
            c.compute_id === notification.event.compute_id ? notification.event : c
          );
        } else {
          // Add new compute (it wasn't in the initial load)
          this.computes = [...this.computes, notification.event];
        }
        break;
      case 'compute.deleted':
        // Remove deleted compute from the list
        this.computes = this.computes.filter((c) => c.compute_id !== notification.event.compute_id);
        break;
    }
    // Trigger change detection for zoneless mode
    this.cd.markForCheck();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  setSortingOrder() {
    if (this.sortingOrder === 'asc') {
      this.filteredNodes = this.filteredNodes.sort(this.compareAsc);
    } else {
      this.filteredNodes = this.filteredNodes.sort(this.compareDesc);
    }
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

    if (this.sortingOrder === 'asc') {
      this.filteredNodes = nodes.sort(this.compareAsc);
    } else {
      this.filteredNodes = nodes.sort(this.compareDesc);
    }
  }

  checkCapturing(nodes: Node[]): Node[] {
    let links = this.linksDataSource.getItems();
    let nodesWithCapturing: string[] = [];

    links.forEach((link) => {
      if (link.capturing) {
        link.nodes.forEach((node) => {
          nodesWithCapturing.push(node.node_id);
        });
      }
    });

    let filteredNodes: Node[] = [];
    nodes.forEach((node) => {
      if (nodesWithCapturing.includes(node.node_id)) {
        filteredNodes.push(node);
      }
    });
    return filteredNodes;
  }

  checkPacketFilters(nodes: Node[]): Node[] {
    let links = this.linksDataSource.getItems();
    let nodesWithPacketFilters: string[] = [];

    links.forEach((link) => {
      if (
        link.filters.bpf ||
        link.filters.corrupt ||
        link.filters.corrupt ||
        link.filters.packet_loss ||
        link.filters.frequency_drop
      ) {
        link.nodes.forEach((node) => {
          nodesWithPacketFilters.push(node.node_id);
        });
      }
    });

    let filteredNodes: Node[] = [];
    nodes.forEach((node) => {
      if (nodesWithPacketFilters.includes(node.node_id)) {
        filteredNodes.push(node);
      }
    });
    return filteredNodes;
  }

  close() {
    this.closeTopologySummary.emit(false);
  }

  truncateComputeName(name: string): string {
    if (!name) return '';
    const maxLength = 15;
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
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
