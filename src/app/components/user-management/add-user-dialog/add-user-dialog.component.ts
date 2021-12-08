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

@Component({
  selector: 'app-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss']
})
export class AddUserDialogComponent implements OnInit {
  addUserForm: FormGroup;
  server: Server;

  constructor(public dialogRef: MatDialogRef<AddUserDialogComponent>,
              public userService: UserService,
              private toasterService: ToasterService) { }

  ngOnInit(): void {
    this.addUserForm = new FormGroup({
      username: new FormControl(null, [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern("[a-zA-Z0-9_-]+$")]),
      full_name: new FormControl(),
      email: new FormControl(null, [Validators.email, Validators.required]),
      password: new FormControl(null,
        [Validators.required, Validators.minLength(6), Validators.maxLength(100)]),
      is_active: new FormControl(true),
      is_superadmin: new FormControl(false)
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  onAddClick() {
    if (!this.addUserForm.valid) {
      return;
    }
    const newUser = this.addUserForm.value;
    this.userService.add(this.server,  newUser)
      .subscribe((user: User) => {
        console.log("Done ", user)
        this.toasterService.success(`User ${user.username} added`);
        this.dialogRef.close();
      },
      (error) => {
        this.toasterService.error('Cannot create user : ' + error);
      })
  }
}
