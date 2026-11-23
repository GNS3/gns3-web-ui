import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject,
  signal,
  computed,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UntypedFormControl, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Group } from '@models/groups/group';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ACE, ACEDetailed } from '@models/api/ACE';
import { Endpoint } from '@models/api/endpoint';
import { Role } from '@models/api/role';
import { GroupService } from '@services/group.service';
import { AclService } from '@services/acl.service';
import { RoleService } from '@services/role.service';
import { ToasterService } from '@services/toaster.service';
import { AddUserToGroupDialogComponent } from '@components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import {
  UserDetailDialogComponent,
  UserDetailDialogData,
} from '@components/user-management/user-detail-dialog/user-detail-dialog.component';
import { HasPrivilegeDirective } from '@directives/has-privilege.directive';

export interface GroupDetailDialogData {
  group: Group;
  controller: Controller;
}

@Component({
  selector: 'app-group-detail-dialog',
  standalone: true,
  templateUrl: './group-detail-dialog.component.html',
  styleUrl: './group-detail-dialog.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatSelectModule,
    MatTooltipModule,
    HasPrivilegeDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailDialogComponent implements OnInit {
  // Quota modes exposed for the template's mat-option values. Groups have no
  // inherit semantics: null (and -1) both mean unlimited.
  readonly quotaModeUnlimited = 'unlimited';
  readonly quotaModeCustom = 'custom';

  private static readonly QUOTA_FIELDS = ['default_max_nodes', 'default_max_running_nodes'] as const;

  private dialogRef = inject(MatDialogRef<GroupDetailDialogComponent>);
  private dialog = inject(MatDialog);
  private groupService = inject(GroupService);
  private aclService = inject(AclService);
  private roleService = inject(RoleService);
  private toastService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  group: Group;
  controller: Controller;
  editGroupForm: UntypedFormGroup;
  members = signal<User[]>([]);
  aces: ACEDetailed[] = [];
  aceDatasource = new MatTableDataSource<ACEDetailed>();
  aceDisplayedColumns = ['endpoint', 'role', 'propagate', 'allowed'];
  readonly searchMembers = model('');

  filteredMembers = computed(() => {
    const search = this.searchMembers().toLowerCase();
    const members = this.members();
    if (!search) return members;
    return members.filter((m) => m.username.toLowerCase().includes(search));
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: GroupDetailDialogData) {
    this.group = data.group;
    this.controller = data.controller;
  }

  ngOnInit(): void {
    this.editGroupForm = new UntypedFormGroup({
      groupname: new UntypedFormControl(this.group.name, [Validators.required]),
      default_max_nodes_mode: new UntypedFormControl(this.quotaMode(this.group.default_max_nodes)),
      default_max_nodes_value: new UntypedFormControl(this.quotaSeed(this.group.default_max_nodes)),
      default_max_running_nodes_mode: new UntypedFormControl(this.quotaMode(this.group.default_max_running_nodes)),
      default_max_running_nodes_value: new UntypedFormControl(this.quotaSeed(this.group.default_max_running_nodes)),
    });
    for (const field of GroupDetailDialogComponent.QUOTA_FIELDS) {
      this.syncQuotaValidators(field);
      this.editGroupForm.get(`${field}_mode`)?.valueChanges.subscribe(() => this.syncQuotaValidators(field));
    }
    // Built-in groups cannot be renamed server-side; lock the field instead
    // of leaving it editable with a dead save.
    if (this.group.is_builtin) {
      this.editGroupForm.get('groupname')?.disable();
    }
    this.loadMembers();
    this.loadAces();
  }

  get form() {
    return this.editGroupForm.controls;
  }

  // Maps the stored default to the select mode: null and -1 = unlimited,
  // a number = custom limit.
  private quotaMode(value: number | null | undefined): string {
    return value !== null && value !== undefined && value >= 0 ? this.quotaModeCustom : this.quotaModeUnlimited;
  }

  // The limit input is only seeded with a meaningful number (custom limits).
  private quotaSeed(value: number | null | undefined): number | null {
    return value !== null && value !== undefined && value >= 0 ? value : null;
  }

  // The limit input is validated only while the "Custom limit" mode is
  // selected; hidden modes must not make the whole form invalid.
  private syncQuotaValidators(field: 'default_max_nodes' | 'default_max_running_nodes'): void {
    const mode = this.editGroupForm.get(`${field}_mode`);
    const value = this.editGroupForm.get(`${field}_value`);
    if (!mode || !value) {
      return;
    }
    value.setValidators(mode.value === this.quotaModeCustom ? [Validators.required, Validators.min(0)] : null);
    value.updateValueAndValidity();
  }

  loadMembers(): void {
    this.groupService.getGroupMember(this.controller, this.group.user_group_id).subscribe({
      next: (members: User[]) => {
        this.members.set(
          members.sort((a: User, b: User) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()))
        );
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load members';
        this.toastService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  loadAces(): void {
    this.roleService.get(this.controller).subscribe({
      next: (roles: Role[]) => {
        this.aclService.getEndpoints(this.controller).subscribe({
          next: (endps: Endpoint[]) => {
            this.aclService.list(this.controller).subscribe({
              next: (allAces: ACE[]) => {
                // Filter ACEs for this group
                const groupAces = allAces.filter(
                  (ace: ACE) => ace.ace_type === 'group' && ace.group_id === this.group.user_group_id
                );
                this.aces = groupAces.map((ace: ACE) => {
                  const endpoint = endps.filter((endp: Endpoint) => endp.endpoint === ace.path)[0];
                  const role = roles.filter((r: Role) => r.role_id === ace.role_id)[0];
                  return { ...ace, endpoint_name: endpoint?.name || ace.path, role_name: role?.name || 'Unknown' };
                });
                this.aceDatasource.data = this.aces;
                this.cd.markForCheck();
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to load ACEs';
                this.toastService.error(message);
                this.cd.markForCheck();
              },
            });
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load endpoints';
            this.toastService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load roles';
        this.toastService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  onUpdate(): void {
    if (!this.editGroupForm.valid) return;

    // Sparse payload, serialized from the form (idempotent when untouched:
    // unlimited maps back to null, a custom limit to its own number).
    const payload: Partial<Group> = {
      default_max_nodes: this.quotaLimit('default_max_nodes'),
      default_max_running_nodes: this.quotaLimit('default_max_running_nodes'),
    };
    // Built-in groups reject any payload touching "name" server-side, so a
    // quota update must omit the key entirely.
    if (!this.group.is_builtin) {
      payload.name = this.editGroupForm.get('groupname')?.value;
    }
    this.groupService.update(this.controller, this.group, payload).subscribe({
      next: () => {
        if (payload.name !== undefined) {
          this.group.name = payload.name;
        }
        this.group.default_max_nodes = payload.default_max_nodes ?? null;
        this.group.default_max_running_nodes = payload.default_max_running_nodes ?? null;
        this.toastService.success('Group updated successfully');
        // The dialog title binds group.name (plain state, not a signal):
        // without this mark the OnPush view keeps the old name until an
        // unrelated event happens to schedule change detection.
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to update group';
        this.toastService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // Serializes a quota mode into the API value: unlimited -> null, custom ->
  // the typed limit (0 or more).
  private quotaLimit(field: 'default_max_nodes' | 'default_max_running_nodes'): number | null {
    const mode = this.editGroupForm.get(`${field}_mode`);
    const value = this.editGroupForm.get(`${field}_value`);
    if (mode?.value !== this.quotaModeCustom) {
      return null;
    }
    return value?.value ?? null;
  }

  openAddUserDialog(): void {
    this.dialog
      .open(AddUserToGroupDialogComponent, {
        panelClass: [
          'base-dialog-panel',
          'simple-dialog-panel',
          'add-user-to-group-dialog-panel',
          'dialog-medium-panel',
        ],
        data: { controller: this.controller, group: this.group },
      })
      .afterClosed()
      .subscribe((result: boolean) => {
        if (result) {
          this.loadMembers();
        }
      });
  }

  openRemoveUserDialog(user: User): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Remove user from group?',
          message: `User "${user.username}" will lose the permissions granted through this group.`,
          confirmButtonText: 'Remove user',
          tone: 'warning',
          icon: 'person_remove',
        },
      })
      .afterClosed()
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.groupService.removeUser(this.controller, this.group, user).subscribe({
            next: () => {
              this.toastService.success(`User ${user.username} was removed`);
              this.loadMembers();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to remove user';
              this.toastService.error(message);
              this.cd.markForCheck();
            },
          });
        }
      });
  }

  openUserDetailDialog(user: User): void {
    this.dialog.open(UserDetailDialogComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'dialog-large-panel'],
      data: { user, controller: this.controller } as UserDetailDialogData,
    });
  }
}
