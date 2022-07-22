import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComputeStatistics } from '../../../models/computeStatistics';
import{ Controller } from '../../../models/controller';
import { ComputeService } from '../../../services/compute.service';
import { ControllerService } from '../../../services/controller.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-status-info',
  templateUrl: './status-info.component.html',
  styleUrls: ['./status-info.component.scss'],
})
export class StatusInfoComponent implements OnInit {
  public controllerId: string = '';
  public computeStatistics: ComputeStatistics[] = [];
  public connectionFailed: boolean;

  constructor(
    private route: ActivatedRoute,
    private computeService: ComputeService,
    private controllerService: ControllerService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.getStatistics();
  }

  getStatistics() {
    this.controllerService.get(Number(this.controllerId)).then((controller:Controller ) => {
      this.computeService.getStatistics(controller).subscribe((statistics: ComputeStatistics[]) => {
        this.computeStatistics = statistics;
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
