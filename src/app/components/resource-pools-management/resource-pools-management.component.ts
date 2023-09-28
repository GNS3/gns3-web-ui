import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Controller} from "@models/controller";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {SelectionModel} from "@angular/cdk/collections";
import {MatTableDataSource} from "@angular/material/table";
import {ActivatedRoute} from "@angular/router";
import {ControllerService} from "@services/controller.service";
import {ToasterService} from "@services/toaster.service";
import {MatDialog} from "@angular/material/dialog";
import {forkJoin} from "rxjs";
import {ResourcePool} from "@models/resourcePools/ResourcePool";
import {
  AddResourcePoolDialogComponent
} from "@components/resource-pools-management/add-resource-pool-dialog/add-resource-pool-dialog.component";
import {DeleteResourcePoolComponent} from "@components/resource-pools-management/delete-resource-pool/delete-resource-pool.component";
import {ResourcePoolsService} from "@services/resource-pools.service";

@Component({
  selector: 'app-resource-pools-management',
  templateUrl: './resource-pools-management.component.html',
  styleUrls: ['./resource-pools-management.component.scss']
})
export class ResourcePoolsManagementComponent implements OnInit {
  controller: Controller;

  @ViewChildren('resourcePoolsPaginator') resourcePoolsPaginator: QueryList<MatPaginator>;
  @ViewChildren('resourcePoolsSort') resourcePoolsSort: QueryList<MatSort>;

  public displayedColumns = ['select', 'name', 'created_at', 'updated_at', 'delete'];
  selection = new SelectionModel<ResourcePool>(true, []);
  resourcePools: ResourcePool[];
  dataSource = new MatTableDataSource<ResourcePool>();
  searchText: string;
  isReady = false;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private toasterService: ToasterService,
    public resourcePoolsService: ResourcePoolsService,
    public dialog: MatDialog
  ) {
  }


  ngOnInit(): void {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.refresh();
    });
  }

  ngAfterViewInit() {
    this.resourcePoolsPaginator.changes.subscribe((comps: QueryList <MatPaginator>) =>
    {
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
    const numRows = this.resourcePools.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.resourcePools.forEach(row => this.selection.select(row));
  }

  addResourcePool() {
    this.dialog
      .open(AddResourcePoolDialogComponent, {width: '600px', height: '500px', data: {controller: this.controller}})
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added) {
          this.refresh();
        }
      });
  }

  refresh() {
    this.resourcePoolsService.getAll(this.controller).subscribe((resourcePools: ResourcePool[]) => {
      this.isReady = true;
      this.resourcePools = resourcePools;
      this.dataSource.data = resourcePools;
      this.selection.clear();
    });
  }

  onDelete(resourcePoolToDelete: ResourcePool[]) {
    this.dialog
      .open(DeleteResourcePoolComponent, {width: '500px', height: '250px', data: {pools: resourcePoolToDelete}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          const observables = resourcePoolToDelete.map((resourcePool: ResourcePool) => this.resourcePoolsService.delete(this.controller, resourcePool.resource_pool_id));
          forkJoin(observables)
            .subscribe(() => {
                this.refresh();
              },
              (error) => {
                this.toasterService.error(`An error occur while trying to delete resource pool`);
              });
        }
      });
  }

}
