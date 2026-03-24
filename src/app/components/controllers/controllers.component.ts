import { DataSource } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, AfterViewInit, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, interval, merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Controller, ControllerProtocol } from '@models/controller';
import { ControllerManagementService } from '@services/controller-management.service';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { ConfirmationBottomSheetComponent } from '../projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { AddControllerDialogComponent } from './add-controller-dialog/add-controller-dialog.component';
import { EditControllerDialogComponent } from './edit-controller-dialog/edit-controller-dialog.component';
import { ControllerDiscoveryComponent } from './controller-discovery/controller-discovery.component';
import { version } from '../../version';

@Component({
  selector: 'app-controller-list',
  templateUrl: './controllers.component.html',
  styleUrl: './controllers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule, MatSortModule, MatTableModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatBottomSheetModule, MatMenuModule, MatTooltipModule, ControllerDiscoveryComponent]
})
export class ControllersComponent implements OnInit, AfterViewInit, OnDestroy {
  private dialog = inject(MatDialog);
  private controllerService = inject(ControllerService);
  protected controllerDatabase = inject(ControllerDatabase);
  private controllerManagement = inject(ControllerManagementService);
  private changeDetector = inject(ChangeDetectorRef);
  private bottomSheet = inject(MatBottomSheet);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  dataSource: ControllerDataSource | null = null;
  displayedColumns = ['id', 'name', 'status', 'location', 'ip', 'port', 'actions'];
  controllerStatusSubscription: Subscription;
  searchText: string = '';
  private readonly minStartingDisplayMs = 700;
  private readonly statusRefreshIntervalMs = 5000;
  private startingTimestamps: Map<string, number> = new Map();
  private startingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private statusRefreshSubscription: Subscription;
  public readonly version = version;
  public readonly currentYear = new Date().getFullYear();

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor() { }

  getControllers() {
    const runningControllerNames = this.controllerManagement.getRunningControllers();

    this.controllerService.findAll().then((controllers: Controller []) => {
      controllers.forEach((controller) => {
        controller.status = 'stopped';

        const controllerIndex = runningControllerNames.findIndex((controllerName) => controller.name === controllerName);
        if (controllerIndex >= 0) {
          controller.status = 'running';
        }

        if (!controller.protocol) {
          controller.protocol = location.protocol as ControllerProtocol;
        }
      });

      this.controllerDatabase.addControllers(controllers);
      this.changeDetector.markForCheck();

      controllers.forEach((controller) => {
        this.updateControllerOnlineStatus(controller);
      });
    });
  }

  ngOnInit() {
    if (this.controllerService && this.controllerService.isServiceInitialized) {
      this.getControllers();
    } else {
      this.controllerService.serviceInitialized.subscribe(async (value: boolean) => {
        if (value) {
          this.getControllers();
        }
      });
    }

    this.startStatusAutoRefresh();

    this.controllerStatusSubscription = this.controllerManagement.controllerStatusChanged.subscribe((controllerStatus) => {
      const controller = this.controllerDatabase.find(controllerStatus.controllerName);
      if (!controller) {
        return;
      }

      const pendingTimeout = this.startingTimeouts.get(controller.name);
      if (pendingTimeout && controllerStatus.status !== 'started') {
        clearTimeout(pendingTimeout);
        this.startingTimeouts.delete(controller.name);
      }

      if (controllerStatus.status === 'starting') {
        controller.status = 'starting';
        this.startingTimestamps.set(controller.name, Date.now());
        this.changeDetector.markForCheck();
      }
      if (controllerStatus.status === 'stopped') {
        controller.status = 'stopped';
        this.startingTimestamps.delete(controller.name);
        this.changeDetector.markForCheck();
      }
      if (controllerStatus.status === 'errored') {
        controller.status = 'stopped';
        this.startingTimestamps.delete(controller.name);
        this.changeDetector.markForCheck();
      }
      if (controllerStatus.status === 'started') {
        const startedAt = this.startingTimestamps.get(controller.name) || Date.now();
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, this.minStartingDisplayMs - elapsed);

        if (delay > 0) {
          const timeout = setTimeout(() => {
            controller.status = 'running';
            this.controllerDatabase.update(controller);
            this.startingTimeouts.delete(controller.name);
            this.startingTimestamps.delete(controller.name);
            this.changeDetector.markForCheck();
          }, delay);
          this.startingTimeouts.set(controller.name, timeout);
          return;
        }

        controller.status = 'running';
        this.startingTimestamps.delete(controller.name);
        this.controllerDatabase.update(controller);
        this.changeDetector.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sort(<MatSortable>{
        id: 'id',
        start: 'asc',
      });
      // Always create dataSource when MatSort is available
      this.dataSource = new ControllerDataSource(this.controllerDatabase, this.sort);
      this.changeDetector.markForCheck();
    }
  }

  ngOnDestroy() {
    this.controllerStatusSubscription.unsubscribe();
    this.startingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.startingTimeouts.clear();
    if (this.statusRefreshSubscription) {
      this.statusRefreshSubscription.unsubscribe();
    }
  }

  startLocalController() {
    const controller = this.controllerDatabase.data.find((n) => n.location === 'bundled' || n.location === 'local');
    if (!controller) {
      return;
    }
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
      panelClass: 'add-controller-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((controller) => {
      if (controller) {
        this.controllerService.create(controller).then((created: Controller ) => {
          created.status = 'stopped';
          this.controllerDatabase.addController(created);
          this.updateControllerOnlineStatus(created);
          this.changeDetector.markForCheck();
        }).catch((error) => {
          this.changeDetector.markForCheck();
        });
      }
    });
  }

  private startStatusAutoRefresh() {
    this.statusRefreshSubscription = interval(this.statusRefreshIntervalMs).subscribe(() => {
      this.refreshControllersStatuses();
    });
  }

  private refreshControllersStatuses() {
    this.controllerDatabase.data.slice().forEach((controller) => {
      if (controller.status === 'starting') {
        return;
      }
      this.updateControllerOnlineStatus(controller);
    });
  }

  private updateControllerOnlineStatus(controller: Controller) {
    this.controllerService.checkControllerVersion(controller).subscribe(
      (controllerInfo) => {
        controller.status = controllerInfo.version.split('.')[0] >= 3 ? 'running' : 'stopped';
        this.controllerDatabase.update(controller);
        this.changeDetector.markForCheck();
      },
      () => {
        controller.status = 'stopped';
        this.controllerDatabase.update(controller);
        this.changeDetector.markForCheck();
      }
    );
  }

  getControllerStatus(controller: Controller ) {
    if (controller.status === undefined) {
      return 'stopped';
    }
    return controller.status;
  }

  deleteController(controller: Controller ) {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to delete the controller?' },
      panelClass: 'confirmation-bottom-sheet',
    });
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.controllerService.delete(controller).then(() => {
          this.controllerDatabase.remove(controller);
          this.changeDetector.markForCheck();
        });
      }
    });
  }

  editController(controller: Controller) {
    const dialogRef = this.dialog.open(EditControllerDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
      panelClass: 'edit-controller-dialog-panel',
      data: { controller: controller }
    });

    // Pass the controller to the dialog component
    dialogRef.componentRef.instance.controller = controller;

    dialogRef.afterClosed().subscribe((updatedController: Controller) => {
      if (updatedController) {
        // Update the controller in the database
        this.controllerDatabase.update(updatedController);
        this.changeDetector.markForCheck();
      }
    });
  }

  async startController(controller: Controller ) {
    if (!controller) {
      return;
    }

    controller.status = 'starting';
    this.controllerDatabase.update(controller);
    this.changeDetector.markForCheck();

    await this.controllerManagement.start(controller);
  }

  async stopController(controller: Controller ) {
    await this.controllerManagement.stop(controller);
  }

  onSearchChange(value: string) {
    if (this.dataSource) {
      this.dataSource.setFilter(value);
    }
  }

  isLightThemeEnabled() {
    return this.themeService.getActualTheme() === 'light';
  }
}

export class ControllerDataSource extends DataSource<Controller> {
  private filterChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private controllerDatabase: ControllerDatabase, private sort: MatSort) {
    super();
  }

  setFilter(filter: string) {
    this.filterChange.next((filter || '').trim().toLowerCase());
  }

  connect(): Observable< Controller[] > {
    return merge(this.controllerDatabase.dataChange, this.sort.sortChange, this.filterChange).pipe(
      map(() => {
        let data = this.controllerDatabase.data.slice();
        const filter = this.filterChange.value;

        if (filter) {
          data = data.filter((controller: Controller) => {
            const row = [
              controller.id,
              controller.name,
              controller.location,
              controller.host,
              controller.port,
              controller.status || 'stopped',
            ]
              .map((value) => String(value || '').toLowerCase())
              .join(' ');
            return row.includes(filter);
          });
        }

        if (!this.sort.active || this.sort.direction === '') {
          return data;
        }

        return data.sort((a, b) => {
          const propertyA = a[this.sort.active] !== undefined ? a[this.sort.active] : '';
          const propertyB = b[this.sort.active] !== undefined ? b[this.sort.active] : '';

          const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
          const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

          return (valueA < valueB ? -1 : 1) * (this.sort.direction === 'asc' ? 1 : -1);
        });
      })
    );
  }

  disconnect() { }
}
