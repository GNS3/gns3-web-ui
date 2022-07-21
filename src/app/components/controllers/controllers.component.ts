import { DataSource } from '@angular/cdk/collections';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChildProcessService } from 'ngx-childprocess';
import { ElectronService } from 'ngx-electron';
import { merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import {Controller , ServerProtocol } from '../../models/controller';
import { ControllerManagementService } from '../../services/controller-management.service';
import { ControllerDatabase } from '../../services/controller.database';
import { ControllerService } from '../../services/controller.service';
import { ConfirmationBottomSheetComponent } from '../projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { AddControllerDialogComponent } from './add-controller-dialog/add-controller-dialog.component';

@Component({
  selector: 'app-controller-list',
  templateUrl: './controllers.component.html',
  styleUrls: ['./controllers.component.scss'],
})
export class ControllersComponent implements OnInit, OnDestroy {
  dataSource: ServerDataSource;
  displayedColumns = ['id', 'name', 'ip', 'port', 'actions'];
  serverStatusSubscription: Subscription;
  isElectronApp: boolean = false;

  constructor(
    private dialog: MatDialog,
    private serverService: ControllerService,
    private serverDatabase: ControllerDatabase,
    private serverManagement: ControllerManagementService,
    private changeDetector: ChangeDetectorRef,
    private electronService: ElectronService,
    private childProcessService: ChildProcessService,
    private bottomSheet: MatBottomSheet,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  getControllers() {
    const runningServersNames = this.serverManagement.getRunningServers();

    this.serverService.findAll().then((controllers:Controller []) => {
      controllers.forEach((controller) => {
        const serverIndex = runningServersNames.findIndex((controllerName) => controller.name === controllerName);
        if (serverIndex >= 0) {
          controller.status = 'running';
        }
      });

      controllers.forEach((controller) => {
        this.serverService.checkServerVersion(controller).subscribe(
          (serverInfo) => {
            if (serverInfo.version.split('.')[0] >= 3) {
              if (!controller.protocol) controller.protocol = location.protocol as ServerProtocol;
              if (!this.serverDatabase.find(controller.name)) this.serverDatabase.addServer(controller);
            }
          },
          (error) => { }
        );
      });
    });
  }

  ngOnInit() {
    this.isElectronApp = this.electronService.isElectronApp;

    if (this.serverService && this.serverService.isServiceInitialized) this.getControllers();

    if (this.serverService && this.serverService.isServiceInitialized) {
      this.serverService.serviceInitialized.subscribe(async (value: boolean) => {
        if (value) {
          this.getControllers();
        }
      });
    }

    this.dataSource = new ServerDataSource(this.serverDatabase);

    this.serverStatusSubscription = this.serverManagement.controllerStatusChanged.subscribe((serverStatus) => {
      const controller = this.serverDatabase.find(serverStatus.serverName);
      if (!controller) {
        return;
      }
      if (serverStatus.status === 'starting') {
        controller.status = 'starting';
      }
      if (serverStatus.status === 'stopped') {
        controller.status = 'stopped';
      }
      if (serverStatus.status === 'errored') {
        controller.status = 'stopped';
      }
      if (serverStatus.status === 'started') {
        controller.status = 'running';
      }
      this.serverDatabase.update(controller);
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    this.serverStatusSubscription.unsubscribe();
  }

  startLocalController() {
    const controller = this.serverDatabase.data.find((n) => n.location === 'bundled' || 'local');
    this.startServer(controller);
  }

  openProjects(controller) {
    this.router.navigate(['/controller', controller.id, 'projects']);
  }

  createModal() {
    const dialogRef = this.dialog.open(AddControllerDialogComponent, {
      width: '350px',
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((controller) => {
      if (controller) {
        this.serverService.create(controller).then((created:Controller ) => {
          this.serverDatabase.addServer(created);
        });
      }
    });
  }

  getServerStatus(controller:Controller ) {
    if (controller.location === 'local') {
      if (controller.status === undefined) {
        return 'stopped';
      }
      return controller.status;
    }
  }

  deleteServer(controller:Controller ) {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete the controller?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.serverService.delete(controller).then(() => {
          this.serverDatabase.remove(controller);
        });
      }
    });
  }

  async startServer(controller:Controller ) {
    await this.serverManagement.start(controller);
  }

  async stopServer(controller:Controller ) {
    await this.serverManagement.stop(controller);
  }
}

export class ServerDataSource extends DataSource<Controller> {
  constructor(private serverDatabase: ControllerDatabase) {
    super();
  }

  connect(): Observable< Controller[] > {
    return merge(this.serverDatabase.dataChange).pipe(
      map(() => {
        return this.serverDatabase.data;
      })
    );
  }

  disconnect() { }
}
