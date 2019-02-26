import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Server } from '../../../models/server';
import { ElectronService } from 'ngx-electron';
import { FormGroup, FormControl, Validators } from '@angular/forms';


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
    'host': new FormControl(''),
    'port': new FormControl(''),
    'authorization': new FormControl('none'),
    'login': new FormControl(''),
    'password': new FormControl('')
  });

  constructor(
    public dialogRef: MatDialogRef<AddServerDialogComponent>,
    private electronService: ElectronService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  getLocations() {
    let locations = [];
    if(this.electronService.isElectronApp) {
      locations.push({ key: 'local', name: 'Local' });
    }
    locations.push({ key: 'remote', name: 'Remote' });
    return locations
  }

  getDefaultLocation() {
    if(this.electronService.isElectronApp) {
      return 'local';
    }
    return 'remote';
  }

  async getDefaultLocalServerPath() {
    if(this.electronService.isElectronApp) {
      return await this.electronService.remote.require('./local-server.js').getLocalServerPath();
    }
    return;
  }

  async ngOnInit() {
    this.locations = this.getLocations();

    const defaultLocalServerPath = await this.getDefaultLocalServerPath();

    this.serverForm.get('location').valueChanges.subscribe((location: string) => {
      const pathControl = this.serverForm.get('path');
      const portControl = this.serverForm.get('port');
      const hostControl = this.serverForm.get('host');

      if(location === 'local') {
        pathControl.setValue(defaultLocalServerPath);
        pathControl.setValidators([Validators.required]);

        portControl.clearValidators();
        hostControl.clearValidators();
      }
      else {
        pathControl.setValue('');
        pathControl.clearValidators();

        portControl.setValidators([Validators.required, Validators.min(0)]);
        hostControl.setValidators([Validators.required]);
      }

      [pathControl, portControl, hostControl].forEach((control) => {
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

    this.serverForm.get('location').setValue(this.getDefaultLocation());
    this.serverForm.get('authorization').setValue('none');
  }

  onAddClick(): void {
    if(!this.serverForm.valid) {
      return;
    }

    const server: Server = Object.assign({}, this.serverForm.value);
    this.dialogRef.close(server);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
