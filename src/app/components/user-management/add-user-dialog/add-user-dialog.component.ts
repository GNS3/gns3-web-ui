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
import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialogRef} from "@angular/material/dialog";
import {UserService} from "@services/user.service";
import {Server} from "@models/server";
import {User} from "@models/users/user";
import {ToasterService} from "@services/toaster.service";
import {userNameAsyncValidator} from "@components/user-management/add-user-dialog/userNameAsyncValidator";
import {userEmailAsyncValidator} from "@components/user-management/add-user-dialog/userEmailAsyncValidator";
import {BehaviorSubject} from "rxjs";
import {Group} from "@models/groups/group";
import {GroupService} from "@services/group.service";
import {Observable} from "rxjs/Rx";
import {startWith} from "rxjs/operators";
import {map} from "rxjs//operators";
import {matchingPassword} from "@components/user-management/ConfirmPasswordValidator";

@Component({
  selector: 'app-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss']
})
export class AddUserDialogComponent implements OnInit {
  addUserForm: FormGroup;
  server: Server;

  groups: Group[];
  groupsToAdd: Set<Group> = new Set([]);
  autocompleteControl = new FormControl();
  filteredGroups: Observable<Group[]>;

  constructor(public dialogRef: MatDialogRef<AddUserDialogComponent>,
              public userService: UserService,
              private toasterService: ToasterService,
              private groupService: GroupService) { }

  ngOnInit(): void {
    this.addUserForm = new FormGroup({
      username: new FormControl(null, [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern("[a-zA-Z0-9_-]+$")],
        [userNameAsyncValidator(this.server, this.userService)]),
      full_name: new FormControl(),
      email: new FormControl(null,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.server, this.userService)]),
      password: new FormControl(null,
        [Validators.required, Validators.minLength(6), Validators.maxLength(100)]),
      confirmPassword: new FormControl(null,
        [Validators.minLength(6), Validators.maxLength(100), Validators.required] ),
      is_active: new FormControl(true)
    },{
      validators: [matchingPassword]
    });
    this.groupService.getGroups(this.server)
      .subscribe((groups: Group[]) => {
      this.groups = groups;
      this.filteredGroups = this.autocompleteControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value)),
      );
    })

  }

  private _filter(value: string): Group[] {
    if (typeof value === 'string') {
      const filterValue = value.toLowerCase();

      return this.groups.filter(option => option.name.toLowerCase().includes(filterValue));
    }

  }

  get form() {
    return this.addUserForm.controls;
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  onAddClick() {
    if (!this.addUserForm.valid) {
      return;
    }
    const newUser = this.addUserForm.value;
    const toAdd = Array.from(this.groupsToAdd.values());
    this.userService.add(this.server,  newUser)
      .subscribe((user: User) => {
        this.toasterService.success(`User ${user.username} added`);
          toAdd.forEach((group: Group) => {
            this.groupService.addMemberToGroup(this.server, group, user)
              .subscribe(() => {
                  this.toasterService.success(`user ${user.username} was added to group ${group.name}`);
                },
                (error) => {
                  this.toasterService.error(`An error occur while trying to add user ${user.username} to group ${group.name}`);
                })
          })
        this.dialogRef.close();
      },
      (error) => {
        this.toasterService.error('Cannot create user : ' + error);
      })
  }

  deleteGroup(group: Group) {
    this.groupsToAdd.delete(group);
  }

  selectedGroup(value: any) {
    this.groupsToAdd.add(value);
  }

  displayFn(value): string {
    return value && value.name ? value.name : '';
  }
}
