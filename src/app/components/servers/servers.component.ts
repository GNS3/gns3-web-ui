import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Observable, merge, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Server } from '../../models/server';
import { ServerService } from '../../services/server.service';
import { ServerDatabase } from '../../services/server.database';
import { AddServerDialogComponent } from './add-server-dialog/add-server-dialog.component';
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
      width: '350px',
      autoFocus: false
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
