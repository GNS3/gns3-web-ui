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
import {ServerService} from "../../services/server.service";
import {ToasterService} from "../../services/toaster.service";
import {GroupService} from "../../services/group.service";
import {Server} from "../../models/server";
import {Group} from "../../models/groups/group";
import {MatSort, Sort} from "@angular/material/sort";
import {MatDialog} from "@angular/material/dialog";
import {AddGroupDialogComponent} from "@components/group-management/add-group-dialog/add-group-dialog.component";
import {DeleteGroupDialogComponent} from "@components/group-management/delete-group-dialog/delete-group-dialog.component";
import {SelectionModel} from "@angular/cdk/collections";
import {forkJoin} from "rxjs";
import {MatPaginator} from "@angular/material/paginator";
import {MatTableDataSource} from "@angular/material/table";

import {User} from "@models/users/user";

@Component({
  selector: 'app-group-management',
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.scss']
})
export class GroupManagementComponent implements OnInit {
  server: Server;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public displayedColumns = ['select', 'name', 'created_at', 'updated_at', 'is_builtin', 'delete'];
  selection = new SelectionModel<Group>(true, []);
  groups: Group[];
  dataSource = new MatTableDataSource<Group>();
  searchText: string;
  isReady = false;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private toasterService: ToasterService,
    public groupService: GroupService,
    public dialog: MatDialog
  ) {
  }


  ngOnInit(): void {
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.groups.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.groups.forEach(row => this.selection.select(row));
  }

  addGroup() {
    this.dialog
      .open(AddGroupDialogComponent, {width: '1000px', height: '700px', data: {server: this.server}})
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added) {
          this.refresh();
        }
      });
  }

  refresh() {
    this.groupService.getGroups(this.server).subscribe((groups: Group[]) => {
      this.isReady = true;
      this.groups = groups;
      this.dataSource.data = groups;
      this.selection.clear();
    });
  }

  onDelete(groupsToDelete: Group[]) {
    this.dialog
      .open(DeleteGroupDialogComponent, {width: '500px', height: '250px', data: {groups: groupsToDelete}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          const observables = groupsToDelete.map((group: Group) => this.groupService.delete(this.server, group.user_group_id));
          forkJoin(observables)
            .subscribe(() => {
                this.refresh();
              },
              (error) => {
                this.toasterService.error(`An error occur while trying to delete group`);
              });
        }
      });
  }
}
