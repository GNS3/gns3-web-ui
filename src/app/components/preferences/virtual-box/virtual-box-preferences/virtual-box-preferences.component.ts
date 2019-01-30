import { Component, OnInit } from "@angular/core";
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Server } from '../../../../models/server';
import { switchMap } from 'rxjs/operators';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';


@Component({
    selector: 'app-virtual-box-preferences',
    templateUrl: './virtual-box-preferences.component.html',
    styleUrls: ['./virtual-box-preferences.component.scss']
})
export class VirtualBoxPreferencesComponent implements OnInit {
    server: Server;
    vboxManagePath: string;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private serverSettingsService: ServerSettingsService,
        private toasterService: ToasterService
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

    restoreDefaults(){
        this.vboxManagePath = '';
    }
}
