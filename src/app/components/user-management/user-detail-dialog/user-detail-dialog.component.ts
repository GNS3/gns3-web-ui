import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { Group } from '@models/groups/group';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ACE, ACEDetailed } from '@models/api/ACE';
import { Endpoint } from '@models/api/endpoint';
import { AclService } from '@services/acl.service';
import { RoleService } from '@services/role.service';
import { Role } from '@models/api/role';
import { userEmailAsyncValidator } from '@components/user-management/add-user-dialog/userEmailAsyncValidator';
import { userNameAsyncValidator } from '@components/user-management/add-user-dialog/userNameAsyncValidator';
import { ChangeUserPasswordComponent } from '@components/user-management/user-detail/change-user-password/change-user-password.component';
import { HasPrivilegeDirective } from '@directives/has-privilege.directive';
import { forkJoin } from 'rxjs';

export interface UserDetailDialogData {
  user: User;
  controller: Controller;
}

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  templateUrl: './user-detail-dialog.component.html',
  styleUrl: './user-detail-dialog.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatCardModule,
    HasPrivilegeDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailDialogComponent implements OnInit {
  // Quota tri-state modes exposed for the template's mat-option values.
  readonly quotaModeInherit = 'inherit';
  readonly quotaModeUnlimited = 'unlimited';
  readonly quotaModeCustom = 'custom';

  private static readonly QUOTA_FIELDS = ['max_nodes', 'max_running_nodes'] as const;

  private dialogRef = inject(MatDialogRef<UserDetailDialogComponent>);
  private userService = inject(UserService);
  private toasterService = inject(ToasterService);
  private aclService = inject(AclService);
  private roleService = inject(RoleService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  editUserForm: UntypedFormGroup;
  groups: Group[] = [];
  aces: ACE[] = [];
  aceDatasource = new MatTableDataSource<ACEDetailed>();
  aceDisplayedColumns = ['endpoint', 'role', 'propagate', 'allowed'];

  groupsLoaded = false;
  acesLoaded = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserDetailDialogData) {
    this.user = data.user;
    this.controller = data.controller;
  }

  user: User;
  controller: Controller;

  ngOnInit(): void {
    this.initForm();
    for (const field of UserDetailDialogComponent.QUOTA_FIELDS) {
      this.syncQuotaValidators(field);
      this.editUserForm.get(`${field}_mode`)?.valueChanges.subscribe(() => this.syncQuotaValidators(field));
    }
    this.loadGroupsData();
    this.loadAceData();
  }

  initForm() {
    this.editUserForm = new UntypedFormGroup({
      username: new UntypedFormControl(
        this.user.username,
        [Validators.required, Validators.minLength(3), Validators.pattern('[a-zA-Z0-9_-]+$')],
        [userNameAsyncValidator(this.controller, this.userService, this.user.username)]
      ),
      full_name: new UntypedFormControl(this.user.full_name),
      email: new UntypedFormControl(
        this.user.email,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.controller, this.userService, this.user.email)]
      ),
      is_active: new UntypedFormControl(this.user.is_active),
      max_nodes_mode: new UntypedFormControl(this.quotaMode(this.user.max_nodes)),
      max_nodes_value: new UntypedFormControl(this.quotaSeed(this.user.max_nodes)),
      max_running_nodes_mode: new UntypedFormControl(this.quotaMode(this.user.max_running_nodes)),
      max_running_nodes_value: new UntypedFormControl(this.quotaSeed(this.user.max_running_nodes)),
    });
  }

  // Maps the stored quota value to the tri-state select mode: null = inherit
  // the group default, -1 = explicitly unlimited, a number = custom limit.
  private quotaMode(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return this.quotaModeInherit;
    }
    if (value === -1) {
      return this.quotaModeUnlimited;
    }
    return this.quotaModeCustom;
  }

  // The limit input is only seeded with a meaningful number (custom limits);
  // it stays empty for inherit/unlimited so switching to "Custom limit"
  // forces the admin to type a value.
  private quotaSeed(value: number | null | undefined): number | null {
    return value !== null && value !== undefined && value >= 0 ? value : null;
  }

  // The limit input is validated only while the "Custom limit" mode is
  // selected; hidden modes must not make the whole form invalid.
  private syncQuotaValidators(field: 'max_nodes' | 'max_running_nodes'): void {
    const mode = this.editUserForm.get(`${field}_mode`);
    const value = this.editUserForm.get(`${field}_value`);
    if (!mode || !value) {
      return;
    }
    value.setValidators(mode.value === this.quotaModeCustom ? [Validators.required, Validators.min(0)] : null);
    value.updateValueAndValidity();
  }

  get form() {
    return this.editUserForm.controls;
  }

  loadGroupsData() {
    this.userService.getGroupsByUserId(this.controller, this.user.user_id).subscribe({
      next: (groups: Group[]) => {
        this.groups = groups;
        this.groupsLoaded = true;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load groups';
        this.toasterService.error(message);
        this.groupsLoaded = true;
        this.cd.markForCheck();
      },
    });
  }

  loadAceData() {
    // Load ACEs using AclService.list() and filter by user
    forkJoin({
      roles: this.roleService.get(this.controller),
      endpoints: this.aclService.getEndpoints(this.controller),
      aces: this.aclService.list(this.controller),
    }).subscribe({
      next: ({ roles, endpoints: endps, aces: allAces }) => {
        // Filter ACEs for this user
        this.aces = allAces.filter((ace: ACE) => ace.ace_type === 'user' && ace.user_id === this.user.user_id);
        this.aceDatasource.data = this.aces.map((ace: ACE) => {
          const endpoint = endps.filter((endp: Endpoint) => endp.endpoint === ace.path)[0];
          const role = roles.filter((r: Role) => r.role_id === ace.role_id)[0];
          return { ...ace, endpoint_name: endpoint?.name || ace.path, role_name: role?.name || 'Unknown' };
        });
        this.acesLoaded = true;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load access control entries';
        this.toasterService.error(message);
        this.acesLoaded = true;
        this.cd.markForCheck();
      },
    });
  }

  onSaveChanges() {
    if (!this.editUserForm.valid) {
      return;
    }

    const updatedUser = this.getUpdatedValues();
    updatedUser['user_id'] = this.user.user_id;
    for (const field of UserDetailDialogComponent.QUOTA_FIELDS) {
      this.addQuotaToPayload(updatedUser, field);
    }

    this.userService.update(this.controller, updatedUser, false).subscribe({
      next: (user: User) => {
        this.toasterService.success(`User ${user.username} updated`);
        this.dialogRef.close(user);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to update user';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  getUpdatedValues() {
    const dirtyValues: Record<string, unknown> = {};

    Object.keys(this.editUserForm.controls).forEach((key) => {
      // The quota mode/value helper controls are serialized explicitly by
      // addQuotaToPayload, never as raw form keys.
      if (key.endsWith('_mode') || key.endsWith('_value')) {
        return;
      }
      const currentControl = this.editUserForm.get(key);

      if (currentControl.dirty && currentControl.value !== this.user[key]) {
        dirtyValues[key] = currentControl.value;
      }
    });

    return dirtyValues;
  }

  // Serializes a quota tri-state into the API value when the admin touched
  // either the mode select or the limit input: inherit -> null (the group
  // default applies), unlimited -> -1, custom -> the typed limit.
  private addQuotaToPayload(payload: Record<string, unknown>, field: 'max_nodes' | 'max_running_nodes'): void {
    const mode = this.editUserForm.get(`${field}_mode`);
    const value = this.editUserForm.get(`${field}_value`);
    if (!mode || !value || (!mode.dirty && !value.dirty)) {
      return;
    }
    if (mode.value === this.quotaModeInherit) {
      payload[field] = null;
    } else if (mode.value === this.quotaModeUnlimited) {
      payload[field] = -1;
    } else {
      payload[field] = value.value;
    }
  }

  onChangePassword() {
    this.dialog.open(ChangeUserPasswordComponent, {
      panelClass: ['base-dialog-panel', 'change-user-password-dialog-panel', 'dialog-small-panel'],
      data: { user: this.user, controller: this.controller },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
