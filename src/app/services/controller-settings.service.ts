import { Injectable } from '@angular/core';
import{ Controller } from '../models/controller';
import { ServerSettings } from '../models/serverSettings';
import { QemuSettings } from '../models/settings/qemu-settings';
import { HttpController } from './http-controller.service';

@Injectable()
export class ControllerSettingsService {
  constructor(private httpServer: HttpController) {}

  get(controller:Controller ) {
    return this.httpServer.get<ServerSettings>(controller, `/settings`);
  }

  update(controller:Controller , serverSettings: ServerSettings) {
    return this.httpServer.post<ServerSettings>(controller, `/settings`, serverSettings);
  }

  getSettingsForQemu(controller:Controller ) {
    return this.httpServer.get<QemuSettings>(controller, `/settings/qemu`);
  }

  updateSettingsForQemu(controller:Controller , qemuSettings: QemuSettings) {
    return this.httpServer.put<QemuSettings>(controller, `/settings/qemu`, {
      enable_hardware_acceleration: qemuSettings.enable_hardware_acceleration,
      require_hardware_acceleration: qemuSettings.require_hardware_acceleration,
    });
  }
}
