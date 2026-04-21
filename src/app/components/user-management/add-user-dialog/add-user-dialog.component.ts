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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { UserService } from '@services/user.service';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { ToasterService } from '@services/toaster.service';
import { userNameAsyncValidator } from '@components/user-management/add-user-dialog/userNameAsyncValidator';
import { userEmailAsyncValidator } from '@components/user-management/add-user-dialog/userEmailAsyncValidator';
import { BehaviorSubject, Observable } from 'rxjs';
import { Group } from '@models/groups/group';
import { GroupService } from '@services/group.service';
import { startWith, map } from 'rxjs/operators';
import { matchingPassword } from '@components/user-management/ConfirmPasswordValidator';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatAutocompleteModule,
  ],
})
export class AddUserDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddUserDialogComponent>);
  private userService = inject(UserService);
  private toasterService = inject(ToasterService);
  private groupService = inject(GroupService);
  private cd = inject(ChangeDetectorRef);

  addUserForm: UntypedFormGroup;
  controller: Controller;

  groups: Group[] = [];
  groupsToAdd: Set<Group> = new Set([]);
  autocompleteControl = new UntypedFormControl();
  filteredGroups: Observable<Group[]>;

  constructor() {}

  ngOnInit(): void {
    this.addUserForm = new UntypedFormGroup(
      {
        username: new UntypedFormControl(
          null,
          [Validators.required, Validators.minLength(3), Validators.pattern('[a-zA-Z0-9_-]+$')],
          [userNameAsyncValidator(this.controller, this.userService)]
        ),
        full_name: new UntypedFormControl(),
        email: new UntypedFormControl(
          null,
          [Validators.email, Validators.required],
          [userEmailAsyncValidator(this.controller, this.userService)]
        ),
        password: new UntypedFormControl(null, [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(100),
        ]),
        confirmPassword: new UntypedFormControl(null, [
          Validators.minLength(6),
          Validators.maxLength(100),
          Validators.required,
        ]),
        is_active: new UntypedFormControl(true),
      },
      {
        validators: [matchingPassword],
      }
    );
    this.groupService.getGroups(this.controller).subscribe((groups: Group[]) => {
      this.groups = groups;
      this.filteredGroups = this.autocompleteControl.valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value))
      );
      this.cd.markForCheck();
    });
  }

  private _filter(value: string): Group[] {
    if (typeof value === 'string') {
      const filterValue = value.toLowerCase();

      return this.groups.filter((option) => option.name.toLowerCase().includes(filterValue));
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
    this.userService.add(this.controller, newUser).subscribe(
      (user: User) => {
        this.toasterService.success(`User ${user.username} added`);
        toAdd.forEach((group: Group) => {
          this.groupService.addMemberToGroup(this.controller, group, user).subscribe(
            () => {
              this.toasterService.success(`user ${user.username} was added to group ${group.name}`);
            },
            (error) => {
              this.toasterService.error(
                `An error occur while trying to add user ${user.username} to group ${group.name}`
              );
            }
          );
        });
        this.dialogRef.close();
      },
      (error: HttpErrorResponse) => {
        this.toasterService.error('Cannot create user: ' + `${error.error?.message || error.message}`);
      }
    );
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
