import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { ServerSettings } from '../models/serverSettings';
import { QemuSettings } from '../models/settings/qemu-settings';

@Injectable()
export class ServerSettingsService {
    constructor(
        private httpServer: HttpServer
    ){}

    get(server: Server) {
        return this.httpServer.get<ServerSettings>(server, `/settings`);
    }

    update(server: Server, serverSettings: ServerSettings) {
        return this.httpServer.post<ServerSettings>(server, `/settings`, serverSettings);
    }

    getSettingsForQemu(server: Server) {
        return this.httpServer.get<QemuSettings>(server, `/settings/qemu`);
    }

    updateSettingsForQemu(server: Server, qemuSettings: QemuSettings) {
        return this.httpServer.put<QemuSettings>(server, `/settings/qemu`, {
            enable_hardware_acceleration: qemuSettings.enable_hardware_acceleration,
            require_hardware_acceleration: qemuSettings.require_hardware_acceleration
        });
    }
}
