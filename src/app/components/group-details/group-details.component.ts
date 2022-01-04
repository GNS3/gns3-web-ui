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
import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Server} from "@models/server";
import {Group} from "@models/groups/group";
import {User} from "@models/users/user";
import {FormControl, FormGroup} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {AddUserToGroupDialogComponent} from "@components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component";
import {RemoveUserToGroupDialogComponent} from "@components/group-details/remove-user-to-group-dialog/remove-user-to-group-dialog.component";
import {GroupService} from "@services/group.service";
import {ToasterService} from "@services/toaster.service";
import {PageEvent} from "@angular/material/paginator";

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit {
  server: Server;
  group: Group;
  members: User[];
  editGroupForm: FormGroup;
  pageEvent: PageEvent | undefined;
  searchMembers: string;

  constructor(private route: ActivatedRoute,
              private dialog: MatDialog,
              private groupService: GroupService,
              private toastService: ToasterService) {

    this.editGroupForm = new FormGroup({
      groupname: new FormControl(''),
    });

    this.route.data.subscribe((d: { group: { server: Server; group: Group, users: User[] } }) => {

      this.server = d.group.server;
      this.group = d.group.group;
      this.members = d.group.users;
      this.editGroupForm.setValue({groupname: this.group.name});
    });


  }

  ngOnInit(): void {

  }

  onUpdate() {
    this.groupService.update(this.server, this.group)
      .subscribe(() => {
        this.toastService.success(`group updated`);
      }, (error) => {
        this.toastService.error('Error: Cannot update group');
        console.log(error);
      });
  }

  openAddUserDialog() {
    this.dialog
      .open<AddUserToGroupDialogComponent>(AddUserToGroupDialogComponent,
        {
          width: '700px', height: '500px',
          data: {server: this.server, group: this.group}
        })
      .afterClosed()
      .subscribe(() => {
        this.reloadMembers();
      });
  }

  openRemoveUserDialog(user: User) {
    this.dialog
      .open<RemoveUserToGroupDialogComponent>(RemoveUserToGroupDialogComponent,
        {width: '500px', height: '200px', data: {user}})
      .afterClosed()
      .subscribe((userToRemove: User) => {
        console.log(userToRemove);
        if (userToRemove) {
          this.groupService.removeUser(this.server, this.group, userToRemove)
            .subscribe(() => {
                this.toastService.success(`User ${user.username} was removed`);
                this.reloadMembers();
              },
              (error) => {
                this.toastService.error(`Error while removing user ${user.username} from ${this.group.name}`);
                console.log(error);
              });
        }
      });
  }

  reloadMembers() {
    this.groupService.getGroupMember(this.server, this.group.user_group_id)
      .subscribe((members: User[]) => {
        this.members = members;
      });
  }
}
