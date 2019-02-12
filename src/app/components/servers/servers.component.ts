import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Observable, merge, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Server } from '../../models/server';
import { ServerService } from '../../services/server.service';
import { ServerDatabase } from '../../services/server.database';
import { ElectronService } from 'ngx-electron';
import { ServerManagementService } from '../../services/server-management.service';

@Component({
  selector: 'app-server-list',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersComponent implements OnInit, OnDestroy {
  dataSource: ServerDataSource;
  displayedColumns = ['id', 'name', 'location', 'ip', 'port', 'actions'];
  serverStatusSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private serverService: ServerService,
    private serverDatabase: ServerDatabase,
    private serverManagement: ServerManagementService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const runningServersNames = this.serverManagement.getRunningServers();

    this.serverService.findAll().then((servers: Server[]) => {
      servers.forEach((server) => {
        const serverIndex = runningServersNames.findIndex((serverName) => server.name === serverName);
        if(serverIndex >= 0) {
          server.status = 'running';
        }
      });
      this.serverDatabase.addServers(servers);
    });

    this.dataSource = new ServerDataSource(this.serverDatabase);

    this.serverStatusSubscription = this.serverManagement.serverStatusChanged.subscribe((serverStatus) => {
      const server = this.serverDatabase.find(serverStatus.serverName);
      if(!server) {
        return;
      }
      if(serverStatus.status === 'stopped') {
        server.status = 'stopped';
      }
      if(serverStatus.status === 'errored') {
        server.status = 'stopped';
      }
      if(serverStatus.status === 'started') {
        server.status = 'running';
      }
      this.serverDatabase.update(server);
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    this.serverStatusSubscription.unsubscribe();
  }

  createModal() {
    const dialogRef = this.dialog.open(AddServerDialogComponent, {
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(server => {
      if (server) {
        this.serverService.create(server).then((created: Server) => {
          this.serverDatabase.addServer(created);
        });
      }
    });
  }

  getServerStatus(server: Server) {
    if(server.location === 'local') {
      if(server.status === undefined) {
        return 'stopped';
      }
      return server.status;
    }
  }

  deleteServer(server: Server) {
    this.serverService.delete(server).then(() => {
      this.serverDatabase.remove(server);
    });
  }

  async startServer(server: Server) {
    await this.serverManagement.start(server);
  }

  async stopServer(server: Server) {
    await this.serverManagement.stop(server);
  }
}

@Component({
  selector: 'app-add-server-dialog',
  templateUrl: 'add-server-dialog.html'
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
    return this.electronService.remote.require('./local-server.js').getLocalServerPath();
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

export class ServerDataSource extends DataSource<Server> {
  constructor(private serverDatabase: ServerDatabase) {
    super();
  }

  connect(): Observable<Server[]> {
    return merge(this.serverDatabase.dataChange).pipe(
      map(() => {
        return this.serverDatabase.data;
      })
    );
  }

  disconnect() {}
}
