import { Injectable } from '@angular/core';
import { Server } from '../models/server';
import { ServerSettings } from '../models/serverSettings';
import { QemuSettings } from '../models/settings/qemu-settings';
import { HttpServer } from './http-server.service';

@Injectable()
export class ServerSettingsService {
  constructor(private httpServer: HttpServer) {}

  get(controller: Server) {
    return this.httpServer.get<ServerSettings>(controller, `/settings`);
  }

  update(controller: Server, serverSettings: ServerSettings) {
    return this.httpServer.post<ServerSettings>(controller, `/settings`, serverSettings);
  }

  getSettingsForQemu(controller: Server) {
    return this.httpServer.get<QemuSettings>(controller, `/settings/qemu`);
  }

  updateSettingsForQemu(controller: Server, qemuSettings: QemuSettings) {
    return this.httpServer.put<QemuSettings>(controller, `/settings/qemu`, {
      enable_hardware_acceleration: qemuSettings.enable_hardware_acceleration,
      require_hardware_acceleration: qemuSettings.require_hardware_acceleration,
    });
  }
}
