import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ComputeStatistics, LinkStats, NodeStats, ProjectStats } from '@models/computeStatistics';
import { Controller } from '@models/controller';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { StatusChartComponent } from '../status-chart/status-chart.component';

@Component({
  selector: 'app-status-info',
  templateUrl: './status-info.component.html',
  styleUrl: './status-info.component.scss',
  imports: [CommonModule, StatusChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusInfoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private computeService = inject(ComputeService);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  public controllerId: string = '';
  public computeStatistics = signal<ComputeStatistics[]>([]);
  public projectStats = signal<ProjectStats>({ total: 0, opened: 0, closed: 0 });
  public nodeStats = signal<NodeStats>({
    total: 0,
    open_project_nodes: 0,
    closed_project_nodes: 0,
    by_type: {},
    by_status: {},
  });
  public linkStats = signal<LinkStats>({ total: 0, capturing: 0 });
  public connectionFailed: boolean;

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.getStatistics();
  }

  getStatistics() {
    this.controllerService
      .get(Number(this.controllerId))
      .then(
        (controller: Controller) => {
          this.computeService.getStatistics(controller).subscribe({
            next: (statistics) => {
              this.computeStatistics.set(statistics.computes);
              this.projectStats.set(statistics.projects);
              this.nodeStats.set(statistics.nodes);
              this.linkStats.set(statistics.links);
              setTimeout(() => {
                this.getStatistics();
              }, 20000);
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to load statistics';
              this.toasterService.error(message);
              this.connectionFailed = true;
              this.cd.markForCheck();
            },
          });
        },
        (err) => {
          const message = err.error?.message || err.message || 'Failed to load controller';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      );
  }
}
