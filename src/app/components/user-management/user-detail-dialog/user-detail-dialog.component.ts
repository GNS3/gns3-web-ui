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
    MatCardModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailDialogComponent implements OnInit {
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
    });
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
      error: (error) => {
        console.error('Failed to load groups:', error);
        this.groupsLoaded = true;
        this.cd.markForCheck();
      },
    });
  }

  loadAceData() {
    // Load ACEs using AclService.list() and filter by user
    this.roleService.get(this.controller).subscribe((roles: Role[]) => {
      this.aclService.getEndpoints(this.controller).subscribe((endps: Endpoint[]) => {
        this.aclService.list(this.controller).subscribe({
          next: (allAces: ACE[]) => {
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
          error: (error) => {
            console.error('Failed to load ACEs:', error);
            this.acesLoaded = true;
            this.cd.markForCheck();
          },
        });
      });
    });
  }

  onSaveChanges() {
    if (!this.editUserForm.valid) {
      return;
    }

    const updatedUser = this.getUpdatedValues();
    updatedUser['user_id'] = this.user.user_id;

    this.userService.update(this.controller, updatedUser, false).subscribe(
      (user: User) => {
        this.toasterService.success(`User ${user.username} updated`);
        this.dialogRef.close(user);
      },
      (error) => {
        this.toasterService.error('Cannot update user : ' + error);
      }
    );
  }

  getUpdatedValues() {
    const dirtyValues: Record<string, unknown> = {};

    Object.keys(this.editUserForm.controls).forEach((key) => {
      const currentControl = this.editUserForm.get(key);

      if (currentControl.dirty && currentControl.value !== this.user[key]) {
        dirtyValues[key] = currentControl.value;
      }
    });

    return dirtyValues;
  }

  onChangePassword() {
    this.dialog.open(ChangeUserPasswordComponent, {
      panelClass: ['base-dialog-panel', 'change-user-password-dialog-panel'],
      data: { user: this.user, controller: this.controller },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
