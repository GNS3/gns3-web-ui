import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComputeService } from '../../../services/compute.service';
import { ComputeStatistics } from '../../../models/computeStatistics';
import { ServerService } from '../../../services/server.service';
import { Server } from '../../../models/server';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-status-info',
  templateUrl: './status-info.component.html',
  styleUrls: ['./status-info.component.scss'],
})
export class StatusInfoComponent implements OnInit {
  public serverId: string = '';
  public computeStatistics: ComputeStatistics[] = [];
  public connectionFailed: boolean;

  constructor(
    private route: ActivatedRoute,
    private computeService: ComputeService,
    private serverService: ServerService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.serverId = this.route.snapshot.paramMap.get('server_id');
    this.getStatistics();
  }

  getStatistics() {
    this.serverService.get(Number(this.serverId)).then((server: Server) => {
      this.computeService.getStatistics(server).subscribe((statistics: ComputeStatistics[]) => {
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
