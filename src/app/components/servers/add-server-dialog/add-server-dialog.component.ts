import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Server } from '../../../models/server';
import { ElectronService } from 'ngx-electron';


@Component({
  selector: 'app-add-server-dialog',
  templateUrl: 'add-server-dialog.component.html'
})
export class AddServerDialogComponent implements OnInit {
  server: Server = new Server();

  authorizations = [{ key: 'none', name: 'No authorization' }, { key: 'basic', name: 'Basic authorization' }];
  locations = [];

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

  getDefaultLocalServerPath() {
    if(this.electronService.isElectronApp) {
      return this.electronService.remote.require('./local-server.js').getLocalServerPath();
    }
    return;
  }

  ngOnInit() {
    this.locations = this.getLocations();
    this.server.authorization = 'none';
    this.server.location = this.getDefaultLocation();
    this.server.path = this.getDefaultLocalServerPath();
  }

  onAddClick(): void {
    // clear path if not local server
    if(this.server.location !== 'local') {
      this.server.path = null;
    }
    this.dialogRef.close(this.server);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
