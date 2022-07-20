import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComputeStatistics } from '../../../models/computeStatistics';
import { Server } from '../../../models/server';
import { ComputeService } from '../../../services/compute.service';
import { ServerService } from '../../../services/server.service';
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
    private serverService: ServerService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.getStatistics();
  }

  getStatistics() {
    this.serverService.get(Number(this.controllerId)).then((controller: Server) => {
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
