import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import { ControllerSettings } from '@models/controllerSettings';
import { QemuSettings } from '@models/settings/qemu-settings';
import { HttpController } from './http-controller.service';

@Injectable()
export class ControllerSettingsService {
  constructor(private httpController: HttpController) {}

  get(controller: Controller ) {
    return this.httpController.get<ControllerSettings>(controller, `/settings`);
  }

  update(controller: Controller, controllerSettings: ControllerSettings) {
    return this.httpController.post<ControllerSettings>(controller, `/settings`, controllerSettings);
  }

  getSettingsForQemu(controller: Controller ) {
    return this.httpController.get<QemuSettings>(controller, `/settings/qemu`);
  }

  updateSettingsForQemu(controller: Controller, qemuSettings: QemuSettings) {
    return this.httpController.put<QemuSettings>(controller, `/settings/qemu`, {
      enable_hardware_acceleration: qemuSettings.enable_hardware_acceleration,
      require_hardware_acceleration: qemuSettings.require_hardware_acceleration,
    });
  }
}
