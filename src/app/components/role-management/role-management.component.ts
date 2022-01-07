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
import {Component, OnInit, ViewChild} from '@angular/core';
import {Server} from "@models/server";
import {MatTableDataSource} from "@angular/material/table";
import {SelectionModel} from "@angular/cdk/collections";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {ActivatedRoute, Router} from "@angular/router";
import {ProgressService} from "../../common/progress/progress.service";
import {ServerService} from "@services/server.service";
import {MatDialog} from "@angular/material/dialog";
import {ToasterService} from "@services/toaster.service";
import {Role} from "@models/api/role";
import {RoleService} from "@services/role.service";
import {AddRoleDialogComponent} from "@components/role-management/add-role-dialog/add-role-dialog.component";
import {DeleteRoleDialogComponent} from "@components/role-management/delete-role-dialog/delete-role-dialog.component";
import {forkJoin} from "rxjs";


@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit {
  server: Server;
  dataSource = new MatTableDataSource<Role>();
  displayedColumns = ['select', 'name', 'description', 'permissions', 'delete'];
  selection = new SelectionModel<Role>(true, []);
  searchText = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  isReady = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private progressService: ProgressService,
    private serverService: ServerService,
    public dialog: MatDialog,
    private toasterService: ToasterService) {
  }

  ngOnInit() {
    const serverId = this.route.parent.snapshot.paramMap.get('server_id');
    this.serverService.get(+serverId).then((server: Server) => {
      this.server = server;
      this.refresh();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }

  refresh() {
    this.roleService.get(this.server).subscribe(
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
      data: {server: this.server},
    })
      .afterClosed()
      .subscribe((role: { name: string; description: string }) => {
        if (role) {
          this.roleService.create(this.server, role)
            .subscribe(() => {
                this.toasterService.success(`${role.name} role created`);
                this.refresh();
              },
              (error) => this.toasterService.error(error));
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
          const observables = rolesToDelete.map((role: Role) => this.roleService.delete(this.server, role.role_id));
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
