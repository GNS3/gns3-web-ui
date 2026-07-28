import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of } from 'rxjs';
import { Controller } from '@models/controller';
import { ControllerStatistics, Statistics } from '@models/computeStatistics';
import { Project } from '@models/project';
import { ComputeService } from '@services/compute.service';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { ControllerService } from '@services/controller.service';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';
import { version } from '../../version';

@Component({
  selector: 'app-system-status',
  templateUrl: './system-status.component.html',
  styleUrl: './system-status.component.scss',
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemStatusComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly controllerService = inject(ControllerService);
  private readonly computeService = inject(ComputeService);
  private readonly projectService = inject(ProjectService);
  private readonly versionService = inject(VersionService);
  private readonly connectionManager = inject(ConnectionManagerService);
  private readonly toasterService = inject(ToasterService);
  private readonly cd = inject(ChangeDetectorRef);

  readonly controllerId = signal(0);
  readonly controller = signal<Controller | null>(null);
  readonly statistics = signal<ControllerStatistics | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly gns3Version = signal('');
  readonly webUiVersion = version;
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly statisticsError = signal('');
  readonly lastUpdated = signal<Date | null>(null);

  readonly visibleProjects = computed(() =>
    [...this.projects()]
      .sort((left, right) => {
        if (left.status !== right.status) return left.status === 'opened' ? -1 : 1;
        return left.name.localeCompare(right.name);
      })
      .slice(0, 6)
  );

  readonly runningNodes = computed(() => this.statistics()?.nodes?.by_status?.started ?? 0);
  readonly nodeTypeEntries = computed(() => Object.entries(this.statistics()?.nodes?.by_type ?? {}));
  readonly nodeStatusEntries = computed(() => Object.entries(this.statistics()?.nodes?.by_status ?? {}));

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('controller_id'));
    this.controllerId.set(id);

    if (!Number.isFinite(id) || id <= 0) {
      this.isLoading.set(false);
      this.statisticsError.set('The selected controller is invalid.');
      return;
    }

    this.controllerService.get(id).then(
      (controller) => {
        this.controller.set(controller);
        this.loadSnapshot(true);
        this.startPolling();
      },
      (error) => {
        this.isLoading.set(false);
        this.statisticsError.set('Unable to load the selected controller.');
        this.toasterService.error(error?.error?.message || error?.message || 'Failed to load controller');
        this.cd.markForCheck();
      }
    );
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  refresh() {
    if (!this.isRefreshing()) {
      this.loadSnapshot(false);
    }
  }

  isControllerOnline(): boolean {
    const controller = this.controller();
    return !!controller && (this.connectionManager.isConnectedTo(controller) || controller.status === 'running');
  }

  controllerEndpoint(): string {
    const controller = this.controller();
    if (!controller) return 'Unavailable';
    return `${controller.protocol || 'http:'}//${controller.host}:${controller.port}`;
  }

  formatBytes(bytes: number | null | undefined, decimals = 1): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toFixed(unit === 0 ? 0 : decimals)} ${units[unit]}`;
  }

  formatUptime(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null) return 'Unavailable';
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  formatNodeType(type: string): string {
    const labels: Record<string, string> = {
      qemu: 'QEMU',
      dynamips: 'Dynamips',
      iou: 'IOL',
      docker: 'Docker',
      vpcs: 'VPCS',
      virtualbox: 'VirtualBox',
      vmware: 'VMware',
    };
    return labels[type] || type;
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      started: 'Running',
      stopped: 'Stopped',
      suspended: 'Suspended',
    };
    return labels[status] || status;
  }

  clampPercentage(value: number | null | undefined): number {
    return Math.min(100, Math.max(0, value || 0));
  }

  memorySummary(stats: Statistics): string {
    return `${this.formatBytes(stats.memory_used, 2)} of ${this.formatBytes(stats.memory_total, 2)} (${this.formatBytes(stats.memory_free, 2)} free)`;
  }

  swapSummary(stats: Statistics): string {
    return stats.swap_total
      ? `${this.formatBytes(stats.swap_used, 2)} of ${this.formatBytes(stats.swap_total, 2)} (${this.formatBytes(stats.swap_free, 2)} free)`
      : 'Not configured';
  }

  diskSummary(stats: Statistics): string {
    return stats.disk_total
      ? `${this.formatBytes(stats.disk_used, 2)} of ${this.formatBytes(stats.disk_total, 2)} (${this.formatBytes(stats.disk_free, 2)} free)`
      : 'Capacity details unavailable';
  }

  cpuSummary(stats: Statistics): string {
    const logicalCpus = stats.cpu_count;
    const physicalCpus = stats.cpu_count_physical;
    const coreDescription = physicalCpus
      ? `${physicalCpus} cores${logicalCpus && logicalCpus !== physicalCpus ? ` / ${logicalCpus} threads` : ''}`
      : logicalCpus
        ? `${logicalCpus} logical cores`
        : '';
    return [stats.cpu_model, coreDescription].filter(Boolean).join(' · ') || 'CPU details unavailable';
  }

  hasRawLoadAverage(stats: Statistics): boolean {
    return !!stats.load_average?.length;
  }

  loadAverageValues(stats: Statistics): number[] {
    return stats.load_average?.length ? stats.load_average : stats.load_average_percent;
  }

  private loadSnapshot(initialLoad: boolean) {
    const controller = this.controller();
    if (!controller) return;

    this.isRefreshing.set(true);
    if (initialLoad) this.isLoading.set(true);

    forkJoin({
      statistics: this.computeService.getStatistics(controller).pipe(
        catchError((error) => {
          this.statisticsError.set(error?.error?.message || error?.message || 'Statistics are currently unavailable.');
          return of(null);
        })
      ),
      projects: this.projectService.list(controller).pipe(catchError(() => of([] as Project[]))),
      versionInfo: this.versionService.get(controller).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ statistics, projects, versionInfo }) => {
        if (statistics) {
          this.statistics.set(statistics);
          this.statisticsError.set('');
        }
        this.projects.set(projects);
        this.gns3Version.set(versionInfo?.version || '');
        this.lastUpdated.set(new Date());
        this.isLoading.set(false);
        this.isRefreshing.set(false);
        this.cd.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
        this.statisticsError.set('System status could not be refreshed.');
        this.cd.markForCheck();
      },
    });
  }

  private startPolling() {
    this.pollingInterval = setInterval(() => this.refresh(), 15000);
  }
}
