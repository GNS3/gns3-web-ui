import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ComputeService } from '../../../services/compute.service';
import { ComputeStatistics } from '../../../models/computeStatistics';
import { ServerService } from '../../../services/server.service';
import { Server } from '../../../models/server';


@Component({
    selector: 'app-status-info',
    templateUrl: './status-info.component.html',
    styleUrls: ['./status-info.component.scss']
})
export class StatusInfoComponent implements OnInit {
    public serverId: string = "";
    public computeStatistics: ComputeStatistics[] = [];

    constructor(
        private route: ActivatedRoute,
        private computeService: ComputeService,
        private serverService: ServerService
    ) {}

    ngOnInit() {
        this.serverId = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(Number(this.serverId)).then((server: Server) => {
            this.computeService.getStatistics(server).subscribe((statistics: ComputeStatistics[]) => {
                this.computeStatistics = statistics;
            });
        });
    }
}
