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
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Controller} from "@models/controller";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "@services/user.service";
import {ToasterService} from "@services/toaster.service";
import {userNameAsyncValidator} from "@components/user-management/add-user-dialog/userNameAsyncValidator";
import {userEmailAsyncValidator} from "@components/user-management/add-user-dialog/userEmailAsyncValidator";
import {User} from "@models/users/user";

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit {

  editUserForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<EditUserDialogComponent>,
              public userService: UserService,
              private toasterService: ToasterService,
              @Inject(MAT_DIALOG_DATA) public data: { user: User, controller: Controller }) {}

  ngOnInit(): void {
    this.editUserForm = new FormGroup({
      username: new FormControl(this.data.user.username, [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern("[a-zA-Z0-9_-]+$")],
        [userNameAsyncValidator(this.data.controller, this.userService, this.data.user.username)]),
      full_name: new FormControl(this.data.user.full_name),
      email: new FormControl(this.data.user.email,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.data.controller, this.userService, this.data.user.email)]),
      password: new FormControl(null,
        [Validators.minLength(6), Validators.maxLength(100)]),
      is_active: new FormControl(this.data.user.is_active)
    });
  }

  get form() {
    return this.editUserForm.controls;
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  onEditClick() {
    if (!this.editUserForm.valid) {
      return;
    }
    const updatedUser = this.editUserForm.value;

    updatedUser.user_id = this.data.user.user_id;
    console.log(updatedUser)
    this.userService.update(this.data.controller, updatedUser, false)
      .subscribe((user: User) => {
          console.log("Done ", user)
          this.toasterService.success(`User ${user.username} updated`);
          this.dialogRef.close();
        },
        (error) => {
          this.toasterService.error('Cannot update user : ' + error);
        })
  }

}
