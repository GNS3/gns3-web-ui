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
import {ActivatedRoute, Router} from "@angular/router";
import {Server} from "@models/server";
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
import {ServerService} from "@services/server.service";

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  server: Server;
  dataSource = new MatTableDataSource<User>();
  displayedColumns = ['select', 'username', 'full_name', 'email', 'is_active', 'last_login', 'updated_at', 'delete'];
  selection = new SelectionModel<User>(true, []);
  searchText = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  isReady = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private progressService: ProgressService,
    private serverService: ServerService,
    public dialog: MatDialog,
    private toasterService: ToasterService) { }

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
    this.userService.list(this.server).subscribe(
      (users: User[]) => {
        this.isReady = true;
        this.dataSource.data = users;
      },
      (error) => {
        this.progressService.setError(error);
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
    instance.server = this.server;
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  onDelete(user: User) {
    this.dialog
      .open(DeleteUserDialogComponent, {width: '500px', data: {users: [user]}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.userService.delete(this.server, user.user_id)
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
            this.userService.delete(this.server, user.user_id)
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
