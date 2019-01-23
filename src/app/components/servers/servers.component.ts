import { Component, Inject, OnInit } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

import { Server } from '../../models/server';
import { ServerService } from '../../services/server.service';
import { ServerDatabase } from '../../services/server.database';

@Component({
  selector: 'app-server-list',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersComponent implements OnInit {
  dataSource: ServerDataSource;
  displayedColumns = ['id', 'name', 'ip', 'port', 'actions'];

  constructor(
    private dialog: MatDialog,
    private serverService: ServerService,
    private serverDatabase: ServerDatabase
  ) {}

  ngOnInit() {
    this.serverService.findAll().then((servers: Server[]) => {
      this.serverDatabase.addServers(servers);
    });

    this.dataSource = new ServerDataSource(this.serverDatabase);
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

  deleteServer(server: Server) {
    this.serverService.delete(server).then(() => {
      this.serverDatabase.remove(server);
    });
  }
}

@Component({
  selector: 'app-add-server-dialog',
  templateUrl: 'add-server-dialog.html'
})
export class AddServerDialogComponent implements OnInit {
  server: Server = new Server();

  authorizations = [{ key: 'none', name: 'No authorization' }, { key: 'basic', name: 'Basic authorization' }];

  constructor(public dialogRef: MatDialogRef<AddServerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.server.authorization = 'none';
  }

  onAddClick(): void {
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
