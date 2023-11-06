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
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {AddUserToGroupDialogComponent} from "@components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component";
import {RemoveToGroupDialogComponent} from "@components/group-details/remove-to-group-dialog/remove-to-group-dialog.component";
import {GroupService} from "@services/group.service";
import {ToasterService} from "@services/toaster.service";
import {PageEvent} from "@angular/material/paginator";
import {ACE, ACEDetailed, AceType} from "@models/api/ACE";
import {UserService} from "@services/user.service";
import {RoleService} from "@services/role.service";
import {Role} from "@models/api/role";
import {AclService} from "@services/acl.service";
import {Endpoint} from "@models/api/endpoint";
import {interval} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit {
  controller: Controller;
  group: Group;
  members: User[];
  editGroupForm: UntypedFormGroup;
  pageEvent: PageEvent | undefined;
  searchMembers: string;
  aces: ACE[];
  aceDatasource = new MatTableDataSource<ACEDetailed>();
  public aceDisplayedColumns = ['endpoint', 'role', 'propagate', 'allowed'];

  constructor(private route: ActivatedRoute,
              private dialog: MatDialog,
              private groupService: GroupService,
              private toastService: ToasterService,
              private aclService: AclService,
              private roleService: RoleService) {



    this.route.data.subscribe((d: { controller: Controller; group: Group, members: User[], aces: ACE[] }) => {

      this.controller = d.controller;
      this.group = d.group;
      this.aces = d.aces;
      this.members = d.members.sort((a: User, b: User) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
      this.editGroupForm = new UntypedFormGroup({
        groupname: new UntypedFormControl(this.group.name, [Validators.required]),
      });
    });


  }

  ngOnInit(): void {
    this.roleService.get(this.controller).subscribe((roles: Role[]) => {
      this.aclService.getEndpoints(this.controller).subscribe((endps: Endpoint[]) => {
        this.aceDatasource.data = this.aces.map((ace: ACE) => {
          const endpoint = endps.filter((endp: Endpoint) => endp.endpoint === ace.path)[0]
          const role = roles.filter((r: Role) => r.role_id === ace.role_id)[0]
          return {...ace, endpoint_name: endpoint.name, role_name: role.name}
        })
      })
    })

  }

  onUpdate() {
    this.group.name = this.editGroupForm.get('groupname').value
    console.log(this.editGroupForm.get('groupname'))
    this.groupService.update(this.controller, this.group)
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



  reloadMembers() {
    this.groupService.getGroupMember(this.controller, this.group.user_group_id)
      .subscribe((members: User[]) => {
        this.members = members;
      });
  }

}
