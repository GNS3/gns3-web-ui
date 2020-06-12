import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Server } from '../../../models/server';
import { ElectronService } from 'ngx-electron';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ServerService } from '../../../services/server.service';
import { ToasterService } from '../../../services/toaster.service';


@Component({
  selector: 'app-add-server-dialog',
  templateUrl: 'add-server-dialog.component.html'
})
export class AddServerDialogComponent implements OnInit {
  authorizations = [{ key: 'none', name: 'No authorization' }, { key: 'basic', name: 'Basic authorization' }];
  locations = [];

  serverForm = new FormGroup({
    'name': new FormControl('', [ Validators.required ]),
    'location': new FormControl(''),
    'path': new FormControl(''),
    'ubridge_path': new FormControl(''),
    'host': new FormControl('', [ Validators.required ]),
    'port': new FormControl('', [ Validators.required, Validators.min(1) ]),
    'authorization': new FormControl('none'),
    'login': new FormControl(''),
    'password': new FormControl('')
  });

  constructor(
    public dialogRef: MatDialogRef<AddServerDialogComponent>,
    private electronService: ElectronService,
    private serverService: ServerService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  async getLocations() {
    const localServers = await this.numberOfLocalServers();

    let locations = [];
    if(this.electronService.isElectronApp && localServers === 0) {
      locations.push({ key: 'local', name: 'Local' });
    }
    locations.push({ key: 'remote', name: 'Remote' });
    return locations
  }

  
  async getDefaultLocation() {
    const localServers = await this.numberOfLocalServers();
    if(this.electronService.isElectronApp && localServers === 0) {
      return 'local';
    }
    return 'remote';
  }

  async numberOfLocalServers() {
    const servers = await this.serverService.findAll();

    return servers.filter((server) => server.location === 'local').length;
  }

  getDefaultHost() {
    return '127.0.0.1';
  }

  getDefaultPort() {
    return 3080;
  }

  async getDefaultLocalServerPath() {
    if(this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-server.js').getLocalServerPath();
    }
    return;
  }

  async getDefaultUbridgePath() {
    if(this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-server.js').getUbridgePath();
    }
    return;
  }

  async ngOnInit() {
    this.locations = await this.getLocations();

    const defaultLocalServerPath = await this.getDefaultLocalServerPath();
    const defaultUbridgePath = await this.getDefaultUbridgePath();

    this.serverForm.get('location').valueChanges.subscribe((location: string) => {
      const pathControl = this.serverForm.get('path');
      const ubridgePathControl = this.serverForm.get('ubridge_path');

      if(location === 'local') {
        pathControl.setValue(defaultLocalServerPath);
        pathControl.setValidators([Validators.required]);

        ubridgePathControl.setValue(defaultUbridgePath);
        ubridgePathControl.setValidators([Validators.required]);
      }
      else {
        pathControl.setValue('');
        pathControl.clearValidators();

        ubridgePathControl.setValue('');
        ubridgePathControl.clearValidators();
      }

      [pathControl, ubridgePathControl].forEach((control) => {
        control.updateValueAndValidity({
          onlySelf: true
        });
      })
    });
    
    this.serverForm.get('authorization').valueChanges.subscribe((authorization: string) => {
      const loginControl = this.serverForm.get('login');
      const passwordControl = this.serverForm.get('password');

      if(authorization === 'none') {
        loginControl.clearValidators();
        passwordControl.clearValidators();
      }
      else {
        loginControl.setValidators([Validators.required]);
        passwordControl.setValidators([Validators.required]);
      }

      [loginControl, passwordControl].forEach((control) => {
        control.updateValueAndValidity({
          onlySelf: true
        });
      })
    });

    const defaultLocation = await this.getDefaultLocation();
    this.serverForm.get('location').setValue(defaultLocation);
    this.serverForm.get('host').setValue(this.getDefaultHost());
    this.serverForm.get('port').setValue(this.getDefaultPort());
    this.serverForm.get('authorization').setValue('none');
  }

  onAddClick(): void {
    if(!this.serverForm.valid) {
      return;
    }

    const server: Server = Object.assign({}, this.serverForm.value);
    this.serverService.checkServerVersion(server).subscribe(
      (serverInfo) => {
        if ((serverInfo.version.split('.')[1]>=2) && (serverInfo.version.split('.')[0]>=2)) {
          this.dialogRef.close(server);
          this.toasterService.success(`Server ${server.name} added.`)
        } else {
          this.dialogRef.close();
          this.toasterService.error(`Server version is not supported.`)
        }
      },
      error => { 
        this.toasterService.error('Cannot connect to the server: ' + error)
      }
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
