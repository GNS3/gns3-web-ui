import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ElectronService } from 'ngx-electron';
import { Controller } from '../../../models/controller';
import { ControllerService } from '../../../services/controller.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-add-controller-dialog',
  templateUrl: 'add-controller-dialog.component.html',
})
export class AddControllerDialogComponent implements OnInit {
  protocols = [
    { key: 'http:', name: 'HTTP' },
    { key: 'https:', name: 'HTTPS' },
  ];
  locations = [];

  controllerForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required]),
    location: new UntypedFormControl(''),
    path: new UntypedFormControl(''),
    ubridge_path: new UntypedFormControl(''),
    host: new UntypedFormControl('', [Validators.required]),
    port: new UntypedFormControl('', [Validators.required, Validators.min(1)]),
    protocol: new UntypedFormControl('http:')
  });

  constructor(
    public dialogRef: MatDialogRef<AddControllerDialogComponent>,
    private electronService: ElectronService,
    private controllerService: ControllerService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async getLocations() {
    const localControllers = await this.numberOfLocalControllers();

    let locations = [];
    if (this.electronService.isElectronApp && localControllers === 0) {
      locations.push({ key: 'local', name: 'Local' });
    }
    locations.push({ key: 'remote', name: 'Remote' });
    return locations;
  }

  async getDefaultLocation() {
    const localControllers = await this.numberOfLocalControllers();
    if (this.electronService.isElectronApp && localControllers === 0) {
      return 'local';
    }
    return 'remote';
  }

  async numberOfLocalControllers() {
    const controllers = await this.controllerService.findAll();

    return controllers.filter((controller) => controller.location === 'local').length;
  }

  getDefaultHost() {
    return '127.0.0.1';
  }

  getDefaultPort() {
    return 3080;
  }

  async getDefaultLocalControllerPath() {
    if (this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-controller.js').getLocalControllerPath();
    }
    return;
  }

  async getDefaultUbridgePath() {
    if (this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-controller.js').getUbridgePath();
    }
    return;
  }

  async ngOnInit() {
    this.locations = await this.getLocations();

    const defaultLocalControllerPath = await this.getDefaultLocalControllerPath();
    const defaultUbridgePath = await this.getDefaultUbridgePath();

    this.controllerForm.get('location').valueChanges.subscribe((location: string) => {
      const pathControl = this.controllerForm.get('path');
      const ubridgePathControl = this.controllerForm.get('ubridge_path');

      if (location === 'local') {
        pathControl.setValue(defaultLocalControllerPath);
        pathControl.setValidators([Validators.required]);

        ubridgePathControl.setValue(defaultUbridgePath);
        ubridgePathControl.setValidators([Validators.required]);
      } else {
        pathControl.setValue('');
        pathControl.clearValidators();

        ubridgePathControl.setValue('');
        ubridgePathControl.clearValidators();
      }

      [pathControl, ubridgePathControl].forEach((control) => {
        control.updateValueAndValidity({
          onlySelf: true,
        });
      });
    });

    const defaultLocation = await this.getDefaultLocation();
    this.controllerForm.get('location').setValue(defaultLocation);
    this.controllerForm.get('host').setValue(this.getDefaultHost());
    this.controllerForm.get('port').setValue(this.getDefaultPort());
  }

  onAddClick(): void {
    if (!this.controllerForm.valid) {
      return;
    }

    const controller:Controller  = Object.assign({}, this.controllerForm.value);
    this.controllerService.checkControllerVersion(controller).subscribe(
      (controllerInfo) => {
        if (controllerInfo.version.split('.')[0] >= 3) {
          this.dialogRef.close(controller);
          this.toasterService.success(`Controller ${controller.name} added.`);
        } else {
          this.dialogRef.close();
          this.toasterService.error(`Controller version is not supported.`);
        }
      },
      (error) => {
        this.toasterService.error('Cannot connect to the controller: ' + error);
      }
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
