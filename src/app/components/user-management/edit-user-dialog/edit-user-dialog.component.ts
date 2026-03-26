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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Controller } from '@models/controller';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { userNameAsyncValidator } from '@components/user-management/add-user-dialog/userNameAsyncValidator';
import { userEmailAsyncValidator } from '@components/user-management/add-user-dialog/userEmailAsyncValidator';
import { User } from '@models/users/user';

@Component({
  standalone: true,
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
})
export class EditUserDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EditUserDialogComponent>);
  private userService = inject(UserService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  editUserForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User; controller: Controller }) {}

  ngOnInit(): void {
    this.editUserForm = new FormGroup({
      username: new FormControl(
        this.data.user.username,
        [Validators.required, Validators.minLength(3), Validators.pattern('[a-zA-Z0-9_-]+$')],
        [userNameAsyncValidator(this.data.controller, this.userService, this.data.user.username)]
      ),
      full_name: new FormControl(this.data.user.full_name),
      email: new FormControl(
        this.data.user.email,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.data.controller, this.userService, this.data.user.email)]
      ),
      password: new FormControl(null, [Validators.minLength(6), Validators.maxLength(100)]),
      is_active: new FormControl(this.data.user.is_active),
    });
    this.cd.markForCheck();
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
    console.log(updatedUser);
    this.userService.update(this.data.controller, updatedUser, false).subscribe(
      (user: User) => {
        console.log('Done ', user);
        this.toasterService.success(`User ${user.username} updated`);
        this.dialogRef.close();
      },
      (error) => {
        this.toasterService.error('Cannot update user : ' + error);
      }
    );
  }
}
