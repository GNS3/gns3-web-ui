import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, merge, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Server, ServerProtocol } from '../../models/server';
import { ServerService } from '../../services/server.service';
import { ServerDatabase } from '../../services/server.database';
import { AddServerDialogComponent } from './add-server-dialog/add-server-dialog.component';
import { ServerManagementService } from '../../services/server-management.service';
import { ElectronService } from 'ngx-electron';
import { ChildProcessService } from 'ngx-childprocess';
import { ConfirmationBottomSheetComponent } from '../projects/confirmation-bottomsheet/confirmation-bottomsheet.component';


@Component({
  selector: 'app-server-list',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.scss']
})
export class ServersComponent implements OnInit, OnDestroy {
  dataSource: ServerDataSource;
  displayedColumns = ['id', 'name', 'location', 'ip', 'port', 'actions'];
  serverStatusSubscription: Subscription;
  isElectronApp: boolean = false;

  constructor(
    private dialog: MatDialog,
    private serverService: ServerService,
    private serverDatabase: ServerDatabase,
    private serverManagement: ServerManagementService,
    private changeDetector: ChangeDetectorRef,
    private electronService: ElectronService,
    private childProcessService: ChildProcessService,
    private bottomSheet: MatBottomSheet,
    private route : ActivatedRoute
  ) {}
  
  getServers() {
    const runningServersNames = this.serverManagement.getRunningServers();

    this.serverService.findAll().then((servers: Server[]) => {
      servers.forEach((server) => {
        const serverIndex = runningServersNames.findIndex((serverName) => server.name === serverName);
        if(serverIndex >= 0) {
          server.status = 'running';
        }
      });

      servers.forEach((server) => {
        this.serverService.checkServerVersion(server).subscribe(
          (serverInfo) => {
            if ((serverInfo.version.split('.')[1]>=2) && (serverInfo.version.split('.')[0]>=2)) {
              if (!server.protocol) server.protocol = location.protocol as ServerProtocol;
              if (!this.serverDatabase.find(server.name)) this.serverDatabase.addServer(server);
            }
          },
          error => {}
          );
      });
    });
  }

  ngOnInit() {
    this.isElectronApp = this.electronService.isElectronApp;

    if (this.serverService.isServiceInitialized) this.getServers();

    this.serverService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.getServers();
      }
    });

    this.dataSource = new ServerDataSource(this.serverDatabase);

    this.serverStatusSubscription = this.serverManagement.serverStatusChanged.subscribe((serverStatus) => {
      const server = this.serverDatabase.find(serverStatus.serverName);
      if(!server) {
        return;
      }
      if(serverStatus.status === 'starting') {
        server.status = 'starting';
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

  startLocalServer() {
    const server = this.serverDatabase.data.find(n => n.location === 'bundled' || 'local');
    this.startServer(server);
  }

  createModal() {
    const dialogRef = this.dialog.open(AddServerDialogComponent, {
      width: '350px',
      autoFocus: false,
      disableClose: true
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
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete the server?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.serverService.delete(server).then(() => {
          this.serverDatabase.remove(server);
        }); 
      }
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
