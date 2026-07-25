import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Controller } from '@models/controller';
import { ControllerStatistics, Statistics } from '@models/computeStatistics';
import { ControllerService } from '@services/controller.service';
import { ComputeService } from '@services/compute.service';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { version } from '../../version';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private controllerService = inject(ControllerService);
  private computeService = inject(ComputeService);
  private projectService = inject(ProjectService);
  private toasterService = inject(ToasterService);
  private versionService = inject(VersionService);
  private connectionManager = inject(ConnectionManagerService);
  private route = inject(ActivatedRoute);
  private cd = inject(ChangeDetectorRef);

  readonly controllerId = signal<number>(0);
  readonly activeController = signal<Controller | null>(null);
  readonly statistics = signal<ControllerStatistics | null>(null);
  readonly projectsCount = signal<number>(0);
  readonly totalNodes = signal<number>(0);
  readonly isLoading = signal(true);
  readonly connectionFailed = signal(false);
  readonly appVersion = signal(version || '2.3.1');
  readonly gns3Version = signal<string>('');
  readonly resourceStats = signal<Statistics | null>(null);
  readonly runningNodesByType = signal<Record<string, number>>({});
  readonly nodeTypeOrder = ['qemu', 'dynamips', 'iou', 'docker', 'vpcs', 'virtualbox', 'vmware'];

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const controllerIdParam = this.route.snapshot.paramMap.get('controller_id');
    const id = parseInt(controllerIdParam, 10);
    this.controllerId.set(id);

    this.loadData(id);
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private loadData(id: number) {
    this.isLoading.set(true);

    // Load the active controller
    this.controllerService.get(id).then(
      (controller: Controller) => {
        this.activeController.set(controller);

        // Fetch GNS3 version from the controller API
        this.versionService.get(controller).subscribe({
          next: (v: any) => {
            this.gns3Version.set(v?.version || '');
            this.cd.markForCheck();
          },
          error: () => {
            // Silently ignore
          },
        });

        // Fetch statistics from the controller API
        this.fetchStatistics(controller);

        // Fetch project count directly (fallback if statistics not yet loaded)
        this.projectService.list(controller).subscribe({
          next: (projects) => {
            if (!this.statistics()) {
              this.projectsCount.set(projects.length);
            }
            this.cd.markForCheck();
          },
          error: () => {
            this.cd.markForCheck();
          },
        });

        // Start polling statistics every 10 seconds
        this.startPolling(controller);

        this.isLoading.set(false);
        this.cd.markForCheck();
      },
      () => {
        this.toasterService.error('Failed to load controller');
        this.isLoading.set(false);
        this.cd.markForCheck();
      }
    );
  }

  private fetchStatistics(controller: Controller) {
    this.computeService.getStatistics(controller).subscribe({
      next: (stats: ControllerStatistics) => {
        this.statistics.set(stats);
        this.totalNodes.set(stats.nodes?.total ?? 0);
        this.projectsCount.set(stats.projects?.total ?? 0);

        // Extract resource stats from first compute
        if (stats.computes?.length > 0) {
          this.resourceStats.set(stats.computes[0].statistics);
        }

        // Extract running nodes by type
        if (stats.nodes?.by_type) {
          this.runningNodesByType.set(stats.nodes.by_type);
        }

        this.cd.markForCheck();
      },
      error: () => {
        this.connectionFailed.set(true);
        this.cd.markForCheck();
      },
    });
  }

  private startPolling(controller: Controller) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.fetchStatistics(controller);
    }, 10000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  getControllerStatus(controller: Controller): string {
    if (this.connectionManager.isConnectedTo(controller)) {
      return 'running';
    }
    return controller.status ?? 'stopped';
  }

  getControllerHost(controller: Controller): string {
    return `${controller.protocol || 'http:'}//${controller.host}:${controller.port}`;
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  formatNodeType(type: string): string {
    const typeMap: Record<string, string> = {
      qemu: 'Qemu',
      iou: 'IOL',
      docker: 'Docker',
      vpcs: 'VPCS',
      dynamips: 'Dynamips',
      virtualbox: 'VirtualBox',
      vmware: 'VMware',
    };
    return typeMap[type] || type;
  }
}
