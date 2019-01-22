import { Component, OnInit } from "@angular/core";
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Server } from '../../../../models/server';
import { switchMap } from 'rxjs/operators';
import { ServerService } from '../../../../services/server.service';
import { ServerSettings } from '../../../../models/serverSettings';
import { Qemu } from '../../../../models/server-settings-models/qemu';
import { ToasterService } from '../../../../services/toaster.service';
import { QemuSettings } from '../../../../models/settings/qemu';


@Component({
    selector: 'app-qemu-preferences',
    templateUrl: './qemu-preferences.component.html',
    styleUrls: ['./qemu-preferences.component.scss']
})
export class QemuPreferencesComponent implements OnInit {
    server: Server;
    settings: QemuSettings;

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
          this.serverSettingsService.getSettingsForQemu(this.server).subscribe((settings: QemuSettings) => {
            this.settings = settings;
          });
        });
    }

    apply(){
        if(!this.settings.enable_hardware_acceleration){
            this.settings.require_hardware_acceleration = false;
        }

        this.serverSettingsService.updateSettingsForQemu(this.server, this.settings)
            .subscribe((qemuSettings: QemuSettings) => {
                this.toasterService.success(`Changes applied`);
            });
    }

    restoreDefaults(){
        let defaultSettings : QemuSettings = {
            enable_hardware_acceleration: true,
            require_hardware_acceleration: true
        };

        this.serverSettingsService.updateSettingsForQemu(this.server, defaultSettings)
        .subscribe((qemuSettings: QemuSettings) => {
            this.settings = qemuSettings;
            this.toasterService.success(`Restored to default settings`);
        });
    }
}
