import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../models/server';
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { ServerService } from '../../../../services/server.service';


@Component({
    selector: 'app-dynamips-preferences',
    templateUrl: './dynamips-preferences.component.html',
    styleUrls: ['./dynamips-preferences.component.scss']
})
export class DynamipsPreferencesComponent implements OnInit {
    server: Server;
    dynamipsPath: string;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private serverSettingsService: ServerSettingsService
    ) {}

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;
        });
    }

    restoreDefaults() {
        this.dynamipsPath = '';
    }
}
