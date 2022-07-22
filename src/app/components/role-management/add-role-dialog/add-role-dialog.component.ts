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
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Controller} from "@models/controller";
import {GroupNameValidator} from "@components/group-management/add-group-dialog/GroupNameValidator";
import {GroupService} from "@services/group.service";
import {groupNameAsyncValidator} from "@components/group-management/add-group-dialog/groupNameAsyncValidator";

@Component({
  selector: 'app-add-role-dialog',
  templateUrl: './add-role-dialog.component.html',
  styleUrls: ['./add-role-dialog.component.scss']
})
export class AddRoleDialogComponent implements OnInit {

  roleNameForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<AddRoleDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { controller: Controller },
              private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.roleNameForm = this.formBuilder.group({
      name: new FormControl(),
      description: new FormControl()
    });
  }

  get form() {
    return this.roleNameForm.controls;
  }

  onAddClick() {
    if (this.roleNameForm.invalid) {
      return;
    }
    const roleName = this.roleNameForm.controls['name'].value;
    const description = this.roleNameForm.controls['description'].value;
    this.dialogRef.close({name: roleName, description});
  }

  onNoClick() {
    this.dialogRef.close();
  }


}
