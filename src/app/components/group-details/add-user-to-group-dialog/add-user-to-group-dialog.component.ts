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
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "@services/user.service";
import {Controller} from "@models/controller";
import {BehaviorSubject, forkJoin, observable, Observable, timer} from "rxjs";
import {User} from "@models/users/user";
import {GroupService} from "@services/group.service";
import {Group} from "@models/groups/group";
import {tap} from "rxjs/operators";
import {ToasterService} from "@services/toaster.service";

@Component({
  selector: 'app-add-user-to-group-dialog',
  templateUrl: './add-user-to-group-dialog.component.html',
  styleUrls: ['./add-user-to-group-dialog.component.scss']
})
export class AddUserToGroupDialogComponent implements OnInit {
  users = new BehaviorSubject<User[]>([]);
  displayedUsers = new BehaviorSubject<User[]>([]);

  searchText: string;
  loading = false;

  constructor(private dialog: MatDialogRef<AddUserToGroupDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { controller: Controller; group: Group },
              private userService: UserService,
              private groupService: GroupService,
              private toastService: ToasterService) {
  }

  ngOnInit(): void {
    this.getUsers();
  }

  onSearch() {
    timer(500)
      .subscribe(() => {
        const displayedUsers = this.users.value.filter((user: User) => {
          return user.username.includes(this.searchText) || user.email?.includes(this.searchText);
        });

        this.displayedUsers.next(displayedUsers);
      });
  }

  getUsers() {
    forkJoin([
      this.userService.list(this.data.controller),
      this.groupService.getGroupMember(this.data.controller, this.data.group.user_group_id)
    ]).subscribe((results) => {
      const [userList, members] = results;
      const users = userList.filter((user: User) => {
        return !members.find((u: User) => u.user_id === user.user_id);
      });

      this.users.next(users);
      this.displayedUsers.next(users);

    });

  }

  addUser(user: User) {
    this.loading = true;
    this.groupService
      .addMemberToGroup(this.data.controller, this.data.group, user)
      .subscribe(() => {
        this.toastService.success(`user ${user.username} was added`);
        this.getUsers();
        this.loading = false;
      }, (err) => {
        console.log(err);
        this.toastService.error(`error while adding user ${user.username} to group ${this.data.group.name}`);
        this.loading = false;
      });


  }
}
