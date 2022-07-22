import { DataSource } from '@angular/cdk/collections';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChildProcessService } from 'ngx-childprocess';
import { ElectronService } from 'ngx-electron';
import { merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import {Controller , ControllerProtocol } from '../../models/controller';
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
  dataSource: ControllerDataSource;
  displayedColumns = ['id', 'name', 'location', 'ip', 'port', 'actions'];
  controllerStatusSubscription: Subscription;
  isElectronApp: boolean = false;

  constructor(
    private dialog: MatDialog,
    private controllerService: ControllerService,
    private controllerDatabase: ControllerDatabase,
    private controllerManagement: ControllerManagementService,
    private changeDetector: ChangeDetectorRef,
    private electronService: ElectronService,
    private childProcessService: ChildProcessService,
    private bottomSheet: MatBottomSheet,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  getControllers() {
    const runningControllerNames = this.controllerManagement.getRunningControllers();

    this.controllerService.findAll().then((controllers:Controller []) => {
      controllers.forEach((controller) => {
        const controllerIndex = runningControllerNames.findIndex((controllerName) => controller.name === controllerName);
        if (controllerIndex >= 0) {
          controller.status = 'running';
        }
      });

      controllers.forEach((controller) => {
        this.controllerService.checkControllerVersion(controller).subscribe(
          (controllerInfo) => {
            if (controllerInfo.version.split('.')[0] >= 3) {
              if (!controller.protocol) controller.protocol = location.protocol as ControllerProtocol;
              if (!this.controllerDatabase.find(controller.name)) this.controllerDatabase.addController(controller);
            }
          },
          (error) => { }
        );
      });
    });
  }

  ngOnInit() {
    this.isElectronApp = this.electronService.isElectronApp;

    if (this.controllerService && this.controllerService.isServiceInitialized) this.getControllers();

    if (this.controllerService && this.controllerService.isServiceInitialized) {
      this.controllerService.serviceInitialized.subscribe(async (value: boolean) => {
        if (value) {
          this.getControllers();
        }
      });
    }

    this.dataSource = new ControllerDataSource(this.controllerDatabase);

    this.controllerStatusSubscription = this.controllerManagement.controllerStatusChanged.subscribe((controllerStatus) => {
      const controller = this.controllerDatabase.find(controllerStatus.controllerName);
      if (!controller) {
        return;
      }
      if (controllerStatus.status === 'starting') {
        controller.status = 'starting';
      }
      if (controllerStatus.status === 'stopped') {
        controller.status = 'stopped';
      }
      if (controllerStatus.status === 'errored') {
        controller.status = 'stopped';
      }
      if (controllerStatus.status === 'started') {
        controller.status = 'running';
      }
      this.controllerDatabase.update(controller);
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    this.controllerStatusSubscription.unsubscribe();
  }

  startLocalController() {
    const controller = this.controllerDatabase.data.find((n) => n.location === 'bundled' || 'local');
    this.startController(controller);
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
        this.controllerService.create(controller).then((created:Controller ) => {
          this.controllerDatabase.addController(created);
        });
      }
    });
  }

  getControllerStatus(controller:Controller ) {
    if (controller.location === 'local') {
      if (controller.status === undefined) {
        return 'stopped';
      }
      return controller.status;
    }
  }

  deleteController(controller:Controller ) {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete the controller?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.controllerService.delete(controller).then(() => {
          this.controllerDatabase.remove(controller);
        });
      }
    });
  }

  async startController(controller:Controller ) {
    await this.controllerManagement.start(controller);
  }

  async stopController(controller:Controller ) {
    await this.controllerManagement.stop(controller);
  }
}

export class ControllerDataSource extends DataSource<Controller> {
  constructor(private controllerDatabase: ControllerDatabase) {
    super();
  }

  connect(): Observable< Controller[] > {
    return merge(this.controllerDatabase.dataChange).pipe(
      map(() => {
        return this.controllerDatabase.data;
      })
    );
  }

  disconnect() { }
}
