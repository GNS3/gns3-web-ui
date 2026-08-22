import { DataSource } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, interval, merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Controller, ControllerProtocol } from '@models/controller';
import { ControllerManagementService } from '@services/controller-management.service';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { AddControllerDialogComponent } from './add-controller-dialog/add-controller-dialog.component';
import { EditControllerDialogComponent } from './edit-controller-dialog/edit-controller-dialog.component';
import { version } from '../../version';

@Component({
  selector: 'app-controller-list',
  templateUrl: './controllers.component.html',
  styleUrl: './controllers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatSortModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
})
export class ControllersComponent implements OnInit, AfterViewInit, OnDestroy {
  private dialog = inject(MatDialog);
  private controllerService = inject(ControllerService);
  protected controllerDatabase = inject(ControllerDatabase);
  private controllerManagement = inject(ControllerManagementService);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  private toasterService = inject(ToasterService);

  dataSource: ControllerDataSource | null = null;
  displayedColumns = ['id', 'name', 'status', 'location', 'ip', 'port', 'actions'];
  controllerStatusSubscription: Subscription;
  readonly searchText = model('');
  readonly statusFilter = model('all');
  readonly loading = signal(true);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [5, 10, 25, 50, 100];
  private readonly minStartingDisplayMs = 700;
  private readonly statusRefreshIntervalMs = 5000;
  private startingTimestamps: Map<string, number> = new Map();
  private startingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private statusRefreshSubscription: Subscription;
  public readonly version = version;
  public readonly currentYear = new Date().getFullYear();

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  getControllers() {
    this.loading.set(true);
    const runningControllerNames = this.controllerManagement.getRunningControllers();

    this.controllerService.findAll().then(
      (controllers: Controller[]) => {
        controllers.forEach((controller) => {
          controller.status = 'stopped';

          const controllerIndex = runningControllerNames.findIndex(
            (controllerName) => controller.name === controllerName
          );
          if (controllerIndex >= 0) {
            controller.status = 'running';
          }

          if (!controller.protocol) {
            controller.protocol = location.protocol as ControllerProtocol;
          }
        });

        this.resetPage();
        this.controllerDatabase.addControllers(controllers);
        this.loading.set(false);
        this.changeDetector.markForCheck();

        controllers.forEach((controller) => {
          this.updateControllerOnlineStatus(controller);
        });
      },
      (err) => {
        this.loading.set(false);
        const message = err.error?.message || err.message || 'Failed to load controllers';
        this.toasterService.error(message);
        this.changeDetector.markForCheck();
      }
    );
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

    this.controllerStatusSubscription = this.controllerManagement.controllerStatusChanged.subscribe(
      (controllerStatus) => {
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
          this.controllerDatabase.update(controller);
          this.changeDetector.markForCheck();
        }
        if (controllerStatus.status === 'stopped') {
          controller.status = 'stopped';
          this.startingTimestamps.delete(controller.name);
          this.controllerDatabase.update(controller);
          this.changeDetector.markForCheck();
        }
        if (controllerStatus.status === 'errored') {
          controller.status = 'stopped';
          this.startingTimestamps.delete(controller.name);
          this.controllerDatabase.update(controller);
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
      }
    );
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

  openProjects(controller) {
    this.router.navigate(['/controller', controller.id, 'projects']);
  }

  createModal() {
    const dialogRef = this.dialog.open(AddControllerDialogComponent, {
      panelClass: [
        'base-dialog-panel',
        'controller-small-dialog-panel',
        'add-controller-dialog-panel',
        'dialog-medium-panel',
      ],
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((controller) => {
      if (controller) {
        this.controllerService.create(controller).then(
          (created: Controller) => {
            created.status = 'stopped';
            this.controllerDatabase.addController(created);
            this.updateControllerOnlineStatus(created);
            this.changeDetector.markForCheck();
          },
          (err) => {
            const message = err.error?.message || err.message || 'Failed to create controller';
            this.toasterService.error(message);
            this.changeDetector.markForCheck();
          }
        );
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
    this.controllerService.checkControllerVersion(controller).subscribe({
      next: (controllerInfo) => {
        controller.status = controllerInfo.version.split('.')[0] >= 3 ? 'running' : 'stopped';
        this.controllerDatabase.update(controller);
        this.changeDetector.markForCheck();
      },
      error: () => {
        // Silent failure - controller is considered offline/stopped
        controller.status = 'stopped';
        this.controllerDatabase.update(controller);
        this.changeDetector.markForCheck();
      },
    });
  }

  getControllerStatus(controller: Controller) {
    if (controller.status === undefined) {
      return 'stopped';
    }
    return controller.status;
  }

  deleteController(controller: Controller) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-danger-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete controller?',
        message: `Controller "${controller.name}" will be removed from this Web-UI.`,
        confirmButtonText: 'Delete controller',
        tone: 'danger',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.controllerService.delete(controller).then(
          () => {
            this.resetPage();
            this.controllerDatabase.remove(controller);
            this.toasterService.success(`Controller "${controller.name}" deleted.`);
            this.changeDetector.markForCheck();
          },
          (err) => {
            const message = err.error?.message || err.message || 'Failed to delete controller';
            this.toasterService.error(message);
            this.changeDetector.markForCheck();
          }
        );
      }
    });
  }

  editController(controller: Controller) {
    const dialogRef = this.dialog.open(EditControllerDialogComponent, {
      panelClass: [
        'base-dialog-panel',
        'controller-dialog-panel',
        'edit-controller-dialog-panel',
        'dialog-medium-panel',
      ],
      autoFocus: false,
      disableClose: true,
      data: { controller: controller },
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

  onSearchChange(value: string) {
    this.searchText.set(value);
    this.resetPage();
    if (this.dataSource) {
      this.dataSource.setFilter(value);
    }
  }

  onStatusFilterChange(value: string) {
    this.statusFilter.set(value);
    this.resetPage();
    this.dataSource?.setStatusFilter(value);
  }

  onSortByChange(value: string) {
    if (!this.sort) {
      return;
    }
    this.sort.active = value;
    this.sort.direction = 'asc';
    this.sort.sortChange.emit({ active: value, direction: 'asc' });
    this.resetPage();
  }

  onSortChange() {
    this.resetPage();
  }

  onPageEvent(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.dataSource?.setPage(event);
  }

  trackController(_index: number, controller: Controller) {
    return controller.id;
  }

  private resetPage() {
    this.pageIndex.set(0);
    this.dataSource?.setPage({
      pageIndex: 0,
      pageSize: this.pageSize(),
      length: this.dataSource.filteredLength.value,
    });
  }
}

export class ControllerDataSource extends DataSource<Controller> {
  private filterChange: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private statusFilterChange: BehaviorSubject<string> = new BehaviorSubject<string>('all');
  private pageChange = new BehaviorSubject<PageEvent>({
    pageIndex: 0,
    pageSize: 25,
    length: 0,
  });
  readonly filteredLength = new BehaviorSubject<number>(0);

  constructor(private controllerDatabase: ControllerDatabase, private sort: MatSort) {
    super();
  }

  setFilter(filter: string) {
    this.filterChange.next((filter || '').trim().toLowerCase());
    this.resetPage();
  }

  setStatusFilter(status: string) {
    this.statusFilterChange.next(status || 'all');
    this.resetPage();
  }

  setPage(event: PageEvent) {
    this.pageChange.next(event);
  }

  connect(): Observable<Controller[]> {
    return merge(
      this.controllerDatabase.dataChange,
      this.sort.sortChange,
      this.filterChange,
      this.statusFilterChange,
      this.pageChange
    ).pipe(
      map(() => {
        let data = this.controllerDatabase.data.slice();
        const filter = this.filterChange.value;
        const statusFilter = this.statusFilterChange.value;

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

        if (statusFilter !== 'all') {
          data = data.filter((controller) => (controller.status || 'stopped') === statusFilter);
        }

        if (this.sort.active && this.sort.direction !== '') {
          data.sort((a, b) => {
            const propertyA = a[this.sort.active] !== undefined ? a[this.sort.active] : '';
            const propertyB = b[this.sort.active] !== undefined ? b[this.sort.active] : '';

            const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
            const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

            const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            return comparison * (this.sort.direction === 'asc' ? 1 : -1);
          });
        }

        this.filteredLength.next(data.length);
        const pageSize = this.pageChange.value.pageSize;
        const lastPageIndex = Math.max(Math.ceil(data.length / pageSize) - 1, 0);
        const pageIndex = Math.min(this.pageChange.value.pageIndex, lastPageIndex);
        const start = pageIndex * pageSize;
        return data.slice(start, start + pageSize);
      })
    );
  }

  disconnect() {}

  private resetPage() {
    if (this.pageChange.value.pageIndex !== 0) {
      this.pageChange.next({ ...this.pageChange.value, pageIndex: 0 });
    }
  }
}
