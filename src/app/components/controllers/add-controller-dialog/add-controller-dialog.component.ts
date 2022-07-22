import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ElectronService } from 'ngx-electron';
import{ Controller } from '../../../models/controller';
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

  controllerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    location: new FormControl(''),
    path: new FormControl(''),
    ubridge_path: new FormControl(''),
    host: new FormControl('', [Validators.required]),
    port: new FormControl('', [Validators.required, Validators.min(1)]),
    protocol: new FormControl('http:')
  });

  constructor(
    public dialogRef: MatDialogRef<AddControllerDialogComponent>,
    private electronService: ElectronService,
    private controllerService: ControllerService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async getLocations() {
    const localServers = await this.numberOfLocalServers();

    let locations = [];
    if (this.electronService.isElectronApp && localServers === 0) {
      locations.push({ key: 'local', name: 'Local' });
    }
    locations.push({ key: 'remote', name: 'Remote' });
    return locations;
  }

  async getDefaultLocation() {
    const localServers = await this.numberOfLocalServers();
    if (this.electronService.isElectronApp && localServers === 0) {
      return 'local';
    }
    return 'remote';
  }

  async numberOfLocalServers() {
    const controllers = await this.controllerService.findAll();

    return controllers.filter((controller) => controller.location === 'local').length;
  }

  getDefaultHost() {
    return '127.0.0.1';
  }

  getDefaultPort() {
    return 3080;
  }

  async getDefaultLocalServerPath() {
    if (this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-server.js').getLocalServerPath();
    }
    return;
  }

  async getDefaultUbridgePath() {
    if (this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-server.js').getUbridgePath();
    }
    return;
  }

  async ngOnInit() {
    this.locations = await this.getLocations();

    const defaultLocalServerPath = await this.getDefaultLocalServerPath();
    const defaultUbridgePath = await this.getDefaultUbridgePath();

    this.controllerForm.get('location').valueChanges.subscribe((location: string) => {
      const pathControl = this.controllerForm.get('path');
      const ubridgePathControl = this.controllerForm.get('ubridge_path');

      if (location === 'local') {
        pathControl.setValue(defaultLocalServerPath);
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
    this.controllerService.checkServerVersion(controller).subscribe(
      (serverInfo) => {
        if (serverInfo.version.split('.')[0] >= 3) {
          this.dialogRef.close(controller);
          this.toasterService.success(`Server ${controller.name} added.`);
        } else {
          this.dialogRef.close();
          this.toasterService.error(`Server version is not supported.`);
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
