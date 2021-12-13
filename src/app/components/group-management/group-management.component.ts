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
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ServerService} from "../../services/server.service";
import {ToasterService} from "../../services/toaster.service";
import {GroupService} from "../../services/group.service";
import {Server} from "../../models/server";
import {Group} from "../../models/groups/group";
import {Sort} from "@angular/material/sort";
import {MatDialog} from "@angular/material/dialog";
import {AddGroupDialogComponent} from "@components/group-management/add-group-dialog/add-group-dialog.component";
import {DeleteGroupDialogComponent} from "@components/group-management/delete-group-dialog/delete-group-dialog.component";

@Component({
  selector: 'app-group-management',
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.scss']
})
export class GroupManagementComponent implements OnInit {
  server: Server;

  public displayedColumns = ['name', 'created_at', 'updated_at', 'is_builtin', 'delete'];
  groups: Group[];
  sortedGroups: Group[];
  searchText: string;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private toasterService: ToasterService,
    public groupService: GroupService,
    public dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    const serverId = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(+serverId).then((server: Server) => {
      this.server = server;
      this.groupService.getGroups(server).subscribe((groups: Group[]) => {
        this.groups = groups;
        this.sortedGroups = groups;
      });
    });
  }

  sort(sort: Sort) {
    const data = this.groups.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedGroups = data;
      return;
    }

    this.sortedGroups = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return compare(a.name.toLowerCase(), b.name.toLowerCase(), isAsc);
        case 'created_at':
          return compare(a.created_at, b.created_at, isAsc);
        case 'updated_at':
          return compare(a.updated_at, b.updated_at, isAsc);
        case 'is_builtin':
          return compare(a.is_builtin.toString(), b.is_builtin.toString(), isAsc);
        default:
          return 0;
      }
    });

    function compare(a: number | string, b: number | string, isAsc: boolean) {

      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
  }


  addGroup() {
    this.dialog
      .open(AddGroupDialogComponent, {width: '250px', height: '250px', data: {server: this.server}})
      .afterClosed()
      .subscribe((name: string) => {
        if (name) {
          this.groupService.addGroup(this.server, name)
            .subscribe(() => {
              this.groupService.getGroups(this.server).subscribe((groups: Group[]) => {
                this.groups = groups;
                this.sortedGroups = groups;
              });
            }, (error) => {
              this.toasterService.error(`An error occur while trying to create new group ${name}`);
            });
        }
      });
  }

  onDelete(group: Group) {
    this.dialog
      .open(DeleteGroupDialogComponent, {width: '500px', height: '250px', data: {groupName: group.name}})
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.groupService.delete(this.server, group.user_group_id)
            .subscribe(() => {
              this.groupService.getGroups(this.server).subscribe((groups: Group[]) => {
                this.groups = groups;
                this.sortedGroups = groups;
              });
            }, (error) => {
              this.toasterService.error(`An error occur while trying to delete group ${group.name}`);
            });
        }
      });
  }
}
