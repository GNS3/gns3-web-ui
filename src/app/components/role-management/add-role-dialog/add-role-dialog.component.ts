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
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {Controller} from "@models/controller";
import {GroupNameValidator} from "@components/group-management/add-group-dialog/GroupNameValidator";
import {GroupService} from "@services/group.service";
import {groupNameAsyncValidator} from "@components/group-management/add-group-dialog/groupNameAsyncValidator";

@Component({
  standalone: true,
  selector: 'app-add-role-dialog',
  templateUrl: './add-role-dialog.component.html',
  styleUrls: ['./add-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule]
})
export class AddRoleDialogComponent implements OnInit {

  private dialogRef = inject(MatDialogRef<AddRoleDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  roleNameForm: UntypedFormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { controller: Controller }) {
  }

  ngOnInit(): void {
    this.roleNameForm = this.formBuilder.group({
      name: new UntypedFormControl(),
      description: new UntypedFormControl()
    });
    this.cd.markForCheck();
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
