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
import {Controller} from "@models/controller";
import {Group} from "@models/groups/group";
import {User} from "@models/users/user";
import {FormControl, FormGroup} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {AddUserToGroupDialogComponent} from "@components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component";
import {RemoveToGroupDialogComponent} from "@components/group-details/remove-to-group-dialog/remove-to-group-dialog.component";
import {GroupService} from "@services/group.service";
import {ToasterService} from "@services/toaster.service";
import {PageEvent} from "@angular/material/paginator";
import {Role} from "@models/api/role";
import {AddRoleToGroupComponent} from "@components/group-details/add-role-to-group/add-role-to-group.component";

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit {
  controller: Controller;
  group: Group;
  members: User[];
  editGroupForm: FormGroup;
  pageEvent: PageEvent | undefined;
  searchMembers: string;
  roles: Role[];

  constructor(private route: ActivatedRoute,
              private dialog: MatDialog,
              private groupService: GroupService,
              private toastService: ToasterService) {

    this.editGroupForm = new FormGroup({
      groupname: new FormControl(''),
    });

    this.route.data.subscribe((d: { controller: Controller; group: Group, members: User[], roles: Role[] }) => {

      this.controller = d.controller;
      this.group = d.group;
      this.roles = d.roles;
      this.members = d.members.sort((a: User, b: User) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
      this.editGroupForm.setValue({groupname: this.group.name});
    });
  }

  ngOnInit(): void {

  }

  onUpdate() {
    this.groupService.update(this.controller, this.group)
      .subscribe(() => {
        this.toastService.success(`group updated`);
      }, (error) => {
        this.toastService.error('Error: Cannot update group');
        console.log(error);
      });
  }

  openAddRoleDialog() {
    this.dialog
      .open<AddRoleToGroupComponent>(AddRoleToGroupComponent,
        {
          width: '700px', height: '500px',
          data: {controller: this.controller, group: this.group}
        })
      .afterClosed()
      .subscribe(() => {
        this.reloadRoles();
      });
  }
  openAddUserDialog() {
    this.dialog
      .open<AddUserToGroupDialogComponent>(AddUserToGroupDialogComponent,
        {
          width: '700px', height: '500px',
          data: {controller: this.controller, group: this.group}
        })
      .afterClosed()
      .subscribe(() => {
        this.reloadMembers();
      });
  }

  openRemoveUserDialog(user: User) {
    this.dialog.open<RemoveToGroupDialogComponent>(RemoveToGroupDialogComponent,
        {width: '500px', height: '200px', data: {name: user.username}})
      .afterClosed()
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.groupService.removeUser(this.controller, this.group, user)
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


  openRemoveRoleDialog(role: Role) {
    this.dialog.open<RemoveToGroupDialogComponent>(RemoveToGroupDialogComponent,
      {width: '500px', height: '200px', data: {name: role.name}})
      .afterClosed()
      .subscribe((confirm: string) => {
        if (confirm) {
          this.groupService.removeRole(this.controller, this.group, role)
            .subscribe(() => {
                this.toastService.success(`Role ${role.name} was removed`);
                this.reloadRoles();
              },
              (error) => {
                this.toastService.error(`Error while removing role ${role.name} from ${this.group.name}`);
                console.log(error);
              });
        }
      });
  }

  reloadMembers() {
    this.groupService.getGroupMember(this.controller, this.group.user_group_id)
      .subscribe((members: User[]) => {
        this.members = members;
      });
  }

  reloadRoles() {
    this.groupService.getGroupRole(this.controller, this.group.user_group_id)
      .subscribe((roles: Role[]) => {
        this.roles = roles;
      });
  }
}
