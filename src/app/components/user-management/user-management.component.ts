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
import {Location}  from '@angular/common';
import {ActivatedRoute, Router} from "@angular/router";
import {Controller} from "@models/controller";
import {MatSort} from "@angular/material/sort";
import {UserService} from "@services/user.service";
import {ProgressService} from "../../common/progress/progress.service";
import {User} from "@models/users/user";
import {SelectionModel} from "@angular/cdk/collections";
import {AddUserDialogComponent} from "@components/user-management/add-user-dialog/add-user-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {DeleteUserDialogComponent} from "@components/user-management/delete-user-dialog/delete-user-dialog.component";
import {ToasterService} from "@services/toaster.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatTableDataSource} from "@angular/material/table";
import {ControllerService} from "@services/controller.service";

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  controller: Controller;
  dataSource = new MatTableDataSource<User>();
  displayedColumns = ['select', 'username', 'full_name', 'email', 'is_active', 'last_login', 'updated_at', 'delete'];
  selection = new SelectionModel<User>(true, []);
  searchText = '';

  @ViewChildren('usersPaginator') usersPaginator: QueryList<MatPaginator>;
  @ViewChildren('usersSort') usersSort: QueryList<MatSort>;
  isReady = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private progressService: ProgressService,
    private controllerService: ControllerService,
    public dialog: MatDialog,
    private toasterService: ToasterService,
    private location: Location) { }

  ngOnInit() {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.refresh();
    });
  }

  ngAfterViewInit() {
    this.usersPaginator.changes.subscribe((comps: QueryList <MatPaginator>) =>
    {
      this.dataSource.paginator = comps.first;
    });
    this.usersSort.changes.subscribe((comps: QueryList<MatSort>) => {
      this.dataSource.sort = comps.first;
    })

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'username':
        case 'full_name':
        case 'email':
          return item[property] ? item[property].toLowerCase() : '';
        default:
          return item[property];
      }
    };
  }

  refresh() {
    this.userService.list(this.controller).subscribe(
      (users: User[]) => {
        this.isReady = true;
        this.dataSource.data = users;
      },
      (error) => {
        this.progressService.setError(error);
        this.toasterService.error(`Cannot open the user management page`);
        this.location.back();
      }
    );
  }

  addUser() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  onDelete(user: User) {
    this.dialog
      .open(DeleteUserDialogComponent, {width: '500px', data: {users: [user]}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.userService.delete(this.controller, user.user_id)
            .subscribe(() => {
              this.refresh()
            }, (error) => {
              this.toasterService.error(`An error occur while trying to delete user ${user.username}`);
            });
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

  deleteMultiple() {
    this.dialog
      .open(DeleteUserDialogComponent, {width: '500px', data: {users: this.selection.selected}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.selection.selected.forEach((user: User) => {
            this.userService.delete(this.controller, user.user_id)
              .subscribe(() => {
                this.refresh()
              }, (error) => {
                this.toasterService.error(`An error occur while trying to delete user ${user.username}`);
              });
          })
          this.selection.clear();
        }
      });

  }
}
