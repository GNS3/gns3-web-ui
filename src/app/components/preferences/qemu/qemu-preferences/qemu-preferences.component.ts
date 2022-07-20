import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Server } from '../../../../models/server';
import { QemuSettings } from '../../../../models/settings/qemu-settings';
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-qemu-preferences',
  templateUrl: './qemu-preferences.component.html',
  styleUrls: ['./qemu-preferences.component.scss'],
})
export class QemuPreferencesComponent implements OnInit {
  controller: Server;
  settings: QemuSettings;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private serverSettingsService: ServerSettingsService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.serverService.get(parseInt(controller_id, 10)).then((controller: Server) => {
      this.controller = controller;

      this.serverSettingsService.getSettingsForQemu(this.controller).subscribe((settings: QemuSettings) => {
        this.settings = settings;
      });
    });
  }

  apply() {
    if (!this.settings.enable_hardware_acceleration) {
      this.settings.require_hardware_acceleration = false;
    }

    this.serverSettingsService
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

    this.serverSettingsService
      .updateSettingsForQemu(this.controller, defaultSettings)
      .subscribe((qemuSettings: QemuSettings) => {
        this.settings = qemuSettings;
        this.toasterService.success(`Restored to default settings`);
      });
  }
}
