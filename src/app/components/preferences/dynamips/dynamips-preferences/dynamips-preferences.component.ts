import { Component, OnInit } from "@angular/core";
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Server } from '../../../../models/server';
import { switchMap } from 'rxjs/operators';
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
        this.route.paramMap
        .pipe(
          switchMap((params: ParamMap) => {
            const server_id = params.get('server_id');
            return this.serverService.get(parseInt(server_id, 10));
          })
        )
        .subscribe((server: Server) => {
            this.server = server;
        });
    }
}
