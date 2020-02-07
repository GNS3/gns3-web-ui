import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Server } from '../../../../models/server';
import { QemuSettings } from '../../../../models/settings/qemu-settings';
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';


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
        const server_id = this.route.snapshot.paramMap.get("server_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.serverSettingsService.getSettingsForQemu(this.server).subscribe((settings: QemuSettings) => {
                this.settings = settings;
            });
        });
    }

    apply() {
        if (!this.settings.enable_hardware_acceleration) {
            this.settings.require_hardware_acceleration = false;
        }

        this.serverSettingsService.updateSettingsForQemu(this.server, this.settings)
        .subscribe((qemuSettings: QemuSettings) => {
            this.toasterService.success(`Changes applied`);
        });
    }

    restoreDefaults() {
        const defaultSettings: QemuSettings = {
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
