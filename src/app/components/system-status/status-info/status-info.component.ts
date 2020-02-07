import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ComputeStatistics } from '../../../models/computeStatistics';
import { Server } from '../../../models/server';
import { ComputeService } from '../../../services/compute.service';
import { ServerService } from '../../../services/server.service';
import { ToasterService } from '../../../services/toaster.service';


@Component({
    selector: 'app-status-info',
    templateUrl: './status-info.component.html',
    styleUrls: ['./status-info.component.scss']
})
export class StatusInfoComponent implements OnInit {
    public serverId = "";
    public computeStatistics: ComputeStatistics[] = [];

    constructor(
        private route: ActivatedRoute,
        private computeService: ComputeService,
        private serverService: ServerService,
        private toasterService: ToasterService
    ) {}

    ngOnInit() {
        this.serverId = this.route.snapshot.paramMap.get("server_id");
        this.getStatistics();
    }

    getStatistics() {
        this.serverService.get(Number(this.serverId)).then((server: Server) => {
            this.computeService.getStatistics(server).subscribe(
            (statistics: ComputeStatistics[]) => {
                this.computeStatistics = statistics;
                setTimeout(() => {
                    this.getStatistics();
                },
                10000);
            }),
            error => {
                this.toasterService.error('Required server version is 2.3');
            };
        });
    }
}
