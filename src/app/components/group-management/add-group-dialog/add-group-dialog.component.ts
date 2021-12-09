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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {groupNameAsyncValidator} from "@components/group-management/add-group-dialog/groupNameAsyncValidator";
import {GroupNameValidator} from "@components/group-management/add-group-dialog/GroupNameValidator";
import {GroupService} from "../../../services/group.service";
import {Server} from "../../../models/server";

@Component({
  selector: 'app-add-group-dialog',
  templateUrl: './add-group-dialog.component.html',
  styleUrls: ['./add-group-dialog.component.scss'],
  providers: [GroupNameValidator]
})
export class AddGroupDialogComponent implements OnInit {

  groupNameForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<AddGroupDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { server: Server },
              private formBuilder: FormBuilder,
              private groupNameValidator: GroupNameValidator,
              private groupService: GroupService) {
  }

  ngOnInit(): void {
    this.groupNameForm = this.formBuilder.group({
      groupName: new FormControl(
        null,
        [Validators.required, this.groupNameValidator.get],
        [groupNameAsyncValidator(this.data.server, this.groupService)]
      ),
    });
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }

  get form() {
    return this.groupNameForm.controls;
  }

  onAddClick() {
    if (this.groupNameForm.invalid) {
      return;
    }
    const groupName = this.groupNameForm.controls['groupName'].value;
    this.dialogRef.close(groupName);
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
