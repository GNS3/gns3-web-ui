import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal, computed, model } from '@angular/core';
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
import { RemoveToGroupDialogComponent } from '@components/group-details/remove-to-group-dialog/remove-to-group-dialog.component';
import {
  UserDetailDialogComponent,
  UserDetailDialogData,
} from '@components/user-management/user-detail-dialog/user-detail-dialog.component';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GroupDetailDialogComponent>);
  private dialog = inject(MatDialog);
  private groupService = inject(GroupService);
  private aclService = inject(AclService);
  private roleService = inject(RoleService);
  private toastService = inject(ToasterService);

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
    });
    this.loadMembers();
    this.loadAces();
  }

  loadMembers(): void {
    this.groupService.getGroupMember(this.controller, this.group.user_group_id).subscribe({
      next: (members: User[]) => {
        this.members.set(
          members.sort((a: User, b: User) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()))
        );
        // No need for markForCheck() with signals - they automatically trigger updates
      },
      error: (error) => {
        console.error('Failed to load members:', error);
      },
    });
  }

  loadAces(): void {
    this.roleService.get(this.controller).subscribe((roles: Role[]) => {
      this.aclService.getEndpoints(this.controller).subscribe((endps: Endpoint[]) => {
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
          },
          error: (error) => {
            console.error('Failed to load ACEs:', error);
          },
        });
      });
    });
  }

  onUpdate(): void {
    if (!this.editGroupForm.valid) return;

    const updatedGroup = { ...this.group, name: this.editGroupForm.get('groupname').value };
    this.groupService.update(this.controller, updatedGroup).subscribe({
      next: () => {
        this.group.name = updatedGroup.name;
        this.toastService.success('Group updated successfully');
      },
      error: (error) => {
        this.toastService.error('Cannot update group: ' + error);
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  openAddUserDialog(): void {
    this.dialog
      .open(AddUserToGroupDialogComponent, {
        panelClass: ['base-dialog-panel', 'simple-dialog-panel', 'add-user-to-group-dialog-panel'],
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
      .open(RemoveToGroupDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
        data: { name: user.username },
      })
      .afterClosed()
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.groupService.removeUser(this.controller, this.group, user).subscribe({
            next: () => {
              this.toastService.success(`User ${user.username} was removed`);
              this.loadMembers();
            },
            error: (error) => {
              this.toastService.error(`Error while removing user: ${error}`);
            },
          });
        }
      });
  }

  openUserDetailDialog(user: User): void {
    this.dialog.open(UserDetailDialogComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      data: { user, controller: this.controller } as UserDetailDialogData,
    });
  }
}
