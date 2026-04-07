import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { Controller } from '@models/controller';
import { QemuSettings } from '@models/settings/qemu-settings';
import { ControllerSettingsService } from '@services/controller-settings.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qemu-preferences',
  templateUrl: './qemu-preferences.component.html',
  styleUrls: ['./qemu-preferences.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatCheckboxModule, MatListModule],
})
export class QemuPreferencesComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private controllerSettingsService = inject(ControllerSettingsService);
  private toasterService = inject(ToasterService);
  readonly cd = inject(ChangeDetectorRef);

  controller: Controller;
  settings: QemuSettings;

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.controllerSettingsService.getSettingsForQemu(this.controller).subscribe((settings: QemuSettings) => {
        this.settings = settings;
        this.cd.markForCheck();
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
