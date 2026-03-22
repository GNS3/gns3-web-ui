import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ComputeStatistics } from '@models/computeStatistics';
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

  public controllerId: string = '';
  public computeStatistics = signal<ComputeStatistics[]>([]);
  public connectionFailed: boolean;

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.getStatistics();
  }

  getStatistics() {
    this.controllerService.get(Number(this.controllerId)).then((controller: Controller) => {
      this.computeService.getStatistics(controller).subscribe((statistics: ComputeStatistics[]) => {
        this.computeStatistics.set(statistics);
        setTimeout(() => {
          this.getStatistics();
        }, 20000);
      }),
        (error) => {
          this.connectionFailed = true;
        };
    });
  }
}
