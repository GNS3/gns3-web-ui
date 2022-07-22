import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import{ Controller } from '../../../../models/controller';
import { QemuSettings } from '../../../../models/settings/qemu-settings';
import { ControllerSettingsService } from '../../../../services/controller-settings.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-qemu-preferences',
  templateUrl: './qemu-preferences.component.html',
  styleUrls: ['./qemu-preferences.component.scss'],
})
export class QemuPreferencesComponent implements OnInit {
  controller:Controller ;
  settings: QemuSettings;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private controllerSettingsService: ControllerSettingsService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.controllerSettingsService.getSettingsForQemu(this.controller).subscribe((settings: QemuSettings) => {
        this.settings = settings;
      });
    });
  }

  apply() {
    if (!this.settings.enable_hardware_acceleration) {
      this.settings.require_hardware_acceleration = false;
    }

    this.controllerSettingsService
      .updateSettingsForQemu(this.controller, this.settings)
      .subscribe((qemuSettings: QemuSettings) => {
        this.toasterService.success(`Changes applied`);
      });
  }

  restoreDefaults() {
    let defaultSettings: QemuSettings = {
      enable_hardware_acceleration: true,
      require_hardware_acceleration: true,
    };

    this.controllerSettingsService
      .updateSettingsForQemu(this.controller, defaultSettings)
      .subscribe((qemuSettings: QemuSettings) => {
        this.settings = qemuSettings;
        this.toasterService.success(`Restored to default settings`);
      });
  }
}
