/*
* Software Name : GNS3 Web UI
* Version: 3
* SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
* SPDX-License-Identifier: GPL-3.0-or-later
*
* This software is distributed under the GPL-3.0 or any later version,
* the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
* or see the "LICENSE" file for more details.
*
* Author: Sylvain MATHIEU, Elise LEBEAU
*/
import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Controller} from "@models/controller";
import {MatTableDataSource} from "@angular/material/table";
import {SelectionModel} from "@angular/cdk/collections";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {ActivatedRoute, Router} from "@angular/router";
import {ProgressService} from "../../common/progress/progress.service";
import {ControllerService} from "@services/controller.service";
import {MatDialog} from "@angular/material/dialog";
import {ToasterService} from "@services/toaster.service";
import {Role} from "@models/api/role";
import {RoleService} from "@services/role.service";
import {AddRoleDialogComponent} from "@components/role-management/add-role-dialog/add-role-dialog.component";
import {DeleteRoleDialogComponent} from "@components/role-management/delete-role-dialog/delete-role-dialog.component";
import {forkJoin} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";


@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit {
  controller: Controller;
  dataSource = new MatTableDataSource<Role>();
  displayedColumns = ['select', 'name', 'description', 'delete'];
  selection = new SelectionModel<Role>(true, []);
  searchText = '';

  @ViewChildren('rolesPaginator') rolesPaginator: QueryList<MatPaginator>;
  @ViewChildren('rolesSort') rolesSort: QueryList<MatSort>;
  isReady = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private progressService: ProgressService,
    private controllerService: ControllerService,
    public dialog: MatDialog,
    private toasterService: ToasterService) {
  }

  ngOnInit() {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.refresh();
    });

  }

  ngAfterViewInit() {
    this.rolesPaginator.changes.subscribe((comps: QueryList <MatPaginator>) =>
    {
      this.dataSource.paginator = comps.first;
    });
    this.rolesSort.changes.subscribe((comps: QueryList<MatSort>) => {
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

  refresh() {
    this.roleService.get(this.controller).subscribe(
      (roles: Role[]) => {
        this.isReady = true;
        this.dataSource.data = roles;
      },
      (error) => {
        this.progressService.setError(error);
      }
    );
  }

  addRole() {
    const dialogRef = this.dialog.open(AddRoleDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
      data: {controller: this.controller},
    })
      .afterClosed()
      .subscribe((role: { name: string; description: string }) => {
        if (role) {
          this.roleService.create(this.controller, role)
            .subscribe(() => {
                this.toasterService.success(`${role.name} role created`);
                this.refresh();
              },
              (error: HttpErrorResponse) => this.toasterService.error(`${error.message}
              ${error.error.message}`));
        }
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  onDelete(rolesToDelete: Role[]) {
    this.dialog
      .open(DeleteRoleDialogComponent, {width: '500px', height: '250px', data: {roles: rolesToDelete}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          const observables = rolesToDelete.map((role: Role) => this.roleService.delete(this.controller, role.role_id));
          forkJoin(observables)
            .subscribe(() => {
                this.refresh();
              },
              (error) => {
                this.toasterService.error(`An error occur while trying to delete role`);
              });
        }
      });
  }
}
