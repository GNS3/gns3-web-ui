import { ChangeDetectionStrategy, Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { ComputeStatistics } from '@models/computeStatistics';

@Component({
  selector: 'app-status-chart',
  templateUrl: './status-chart.component.html',
  styleUrl: './status-chart.component.scss',
  imports: [CommonModule, MatCardModule, MatChipsModule, NgCircleProgressModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChartComponent implements OnInit {
  readonly computeStatistics = input<ComputeStatistics>(undefined);

  constructor() {}

  ngOnInit() {}

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
