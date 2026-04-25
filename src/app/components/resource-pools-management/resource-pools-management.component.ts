import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal,
  AfterViewInit,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Controller } from '@models/controller';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { forkJoin } from 'rxjs';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { AddResourcePoolDialogComponent } from '@components/resource-pools-management/add-resource-pool-dialog/add-resource-pool-dialog.component';
import { DeleteResourcePoolComponent } from '@components/resource-pools-management/delete-resource-pool/delete-resource-pool.component';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { ResourcePoolsFilterPipe } from './resource-pools-filter.pipe';

@Component({
  selector: 'app-resource-pools-management',
  templateUrl: './resource-pools-management.component.html',
  styleUrl: './resource-pools-management.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ResourcePoolsFilterPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePoolsManagementComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  public resourcePoolsService = inject(ResourcePoolsService);
  public dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;

  @ViewChildren('resourcePoolsPaginator') resourcePoolsPaginator: QueryList<MatPaginator>;
  @ViewChildren('resourcePoolsSort') resourcePoolsSort: QueryList<MatSort>;

  public displayedColumns = ['select', 'name', 'created_at', 'updated_at'];
  selection = new SelectionModel<ResourcePool>(true, []);
  resourcePools = signal<ResourcePool[]>([]);
  dataSource = new MatTableDataSource<ResourcePool>();
  readonly searchText = model('');
  isReady = signal(false);

  constructor() {}

  ngOnInit(): void {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then(
      (controller: Controller) => {
        this.controller = controller;
        this.refresh();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  ngAfterViewInit() {
    this.resourcePoolsPaginator.changes.subscribe((comps: QueryList<MatPaginator>) => {
      this.dataSource.paginator = comps.first;
    });
    this.resourcePoolsSort.changes.subscribe((comps: QueryList<MatSort>) => {
      this.dataSource.sort = comps.first;
    });
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item[property] ? item[property].toLowerCase() : '';
        default:
          return item[property];
      }
    };
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.resourcePools().length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.resourcePools().forEach((row) => this.selection.select(row));
  }

  addResourcePool() {
    this.dialog
      .open(AddResourcePoolDialogComponent, {
        width: '400px',
        autoFocus: false,
        disableClose: true,
        data: { controller: this.controller },
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added) {
          this.refresh();
        }
      });
  }

  refresh() {
    this.resourcePoolsService.getAll(this.controller).subscribe({
      next: (resourcePools: ResourcePool[]) => {
        this.isReady.set(true);
        this.resourcePools.set(resourcePools);
        this.dataSource.data = resourcePools;
        this.selection.clear();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load resource pools';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  onDelete(resourcePoolToDelete: ResourcePool[]) {
    this.dialog
      .open(DeleteResourcePoolComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { pools: resourcePoolToDelete },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          const observables = resourcePoolToDelete.map((resourcePool: ResourcePool) =>
            this.resourcePoolsService.delete(this.controller, resourcePool.resource_pool_id)
          );
          forkJoin(observables).subscribe({
            next: () => {
              this.refresh();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to delete resource pool';
              this.toasterService.error(message);
              this.cd.markForCheck();
            },
          });
        }
      });
  }
}
