import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ComputeStatistics, LinkStats, NodeStats, ProjectStats } from '@models/computeStatistics';
import { ProgressRingComponent } from './progress-ring/progress-ring.component';

@Component({
  selector: 'app-status-chart',
  templateUrl: './status-chart.component.html',
  styleUrl: './status-chart.component.scss',
  imports: [CommonModule, MatCardModule, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChartComponent {
  readonly computeStatistics = input<ComputeStatistics>(undefined);
  readonly projectStats = input<ProjectStats>(undefined);
  readonly nodeStats = input<NodeStats>(undefined);
  readonly linkStats = input<LinkStats>(undefined);

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getNodeTypeEntries(): [string, number][] {
    const stats = this.nodeStats();
    if (!stats) return [];
    return Object.entries(stats.by_type);
  }

  getNodeStatusEntries(): [string, number][] {
    const stats = this.nodeStats();
    if (!stats) return [];
    return Object.entries(stats.by_status);
  }
}
