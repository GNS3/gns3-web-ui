/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { ProgressService } from '../../common/progress/progress.service';
import { AddUserDialogComponent } from './add-user-dialog/add-user-dialog.component';
import { AiProfileDialogComponent, AiProfileDialogData } from './ai-profile-dialog/ai-profile-dialog.component';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { UserDetailDialogComponent, UserDetailDialogData } from './user-detail-dialog/user-detail-dialog.component';
import { createActionCompletion } from '@utils/action-completion.util';

type UserViewMode = 'list' | 'grid';
type UserScope = 'all' | 'active' | 'administrators';
type UserStatusFilter = 'all' | 'active' | 'inactive';
type UserSortDirection = 'asc' | 'desc' | '';

@Component({
  standalone: true,
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
})
export class UserManagementComponent implements OnInit {
  controller: Controller;
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly searchText = signal('');
  readonly selectedScope = signal<UserScope>('all');
  readonly statusFilter = signal<UserStatusFilter>('all');
  readonly viewMode = signal<UserViewMode>('list');
  readonly selectedUser = signal<User | null>(null);
  readonly sortActive = signal<keyof User>('username');
  readonly sortDirection = signal<UserSortDirection>('asc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [5, 10, 25, 50, 100];
  readonly displayedColumns = ['select', 'username', 'full_name', 'email', 'role', 'is_active', 'actions'];
  readonly selection = new SelectionModel<User>(true, []);

  readonly filteredUsers = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const scope = this.selectedScope();
    const status = this.statusFilter();
    let users = this.users();

    if (scope === 'active') {
      users = users.filter((user) => user.is_active);
    } else if (scope === 'administrators') {
      users = users.filter((user) => user.is_superadmin);
    }

    if (status !== 'all') {
      users = users.filter((user) => user.is_active === (status === 'active'));
    }

    if (search) {
      users = users.filter((user) =>
        [user.username, user.full_name, user.email, this.roleLabel(user)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      );
    }

    const active = this.sortActive();
    const direction = this.sortDirection();
    if (!direction) {
      return users;
    }

    return [...users].sort((left, right) => {
      const a = this.sortValue(left, active);
      const b = this.sortValue(right, active);
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) * (direction === 'asc' ? 1 : -1);
    });
  });

  readonly paginatedUsers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  readonly activeUserCount = computed(() => this.users().filter((user) => user.is_active).length);
  readonly administratorCount = computed(() => this.users().filter((user) => user.is_superadmin).length);

  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private progressService = inject(ProgressService);
  private controllerService = inject(ControllerService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private location = inject(Location);
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const controllerId =
      this.route.snapshot.paramMap.get('controller_id') ??
      this.route.parent?.snapshot.paramMap.get('controller_id') ??
      '';

    this.controllerService.get(Number.parseInt(controllerId, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.refresh();
      },
      (err) => {
        this.loading.set(false);
        this.toasterService.error(err.error?.message || err.message || 'Failed to load controller');
        this.location.back();
        this.cd.markForCheck();
      }
    );
  }

  refresh(): void {
    if (!this.controller) {
      return;
    }

    this.loading.set(true);
    this.userService.list(this.controller).subscribe({
      next: (users: User[]) => {
        this.users.set(users || []);
        this.loading.set(false);
        this.selection.clear();
        this.refreshSelectedUser();
        this.ensureValidPage();
        this.cd.markForCheck();
      },
      error: (err) => {
        this.loading.set(false);
        this.progressService.setError(err);
        this.toasterService.error(err.error?.message || err.message || 'Failed to load users');
        this.location.back();
        this.cd.markForCheck();
      },
    });
  }

  setScope(scope: UserScope): void {
    this.selectedScope.set(scope);
    this.selection.clear();
    this.resetPage();
  }

  setSearch(value: string): void {
    this.searchText.set(value);
    this.selection.clear();
    this.resetPage();
  }

  setStatusFilter(value: UserStatusFilter): void {
    this.statusFilter.set(value);
    this.selection.clear();
    this.resetPage();
  }

  setViewMode(mode: UserViewMode): void {
    this.viewMode.set(mode);
  }

  onSortByChange(active: keyof User): void {
    this.sortActive.set(active);
    if (!this.sortDirection()) {
      this.sortDirection.set('asc');
    }
    this.resetPage();
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set((sort.active || 'username') as keyof User);
    this.sortDirection.set(sort.direction);
    this.resetPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  selectUser(user: User): void {
    this.selectedUser.set(user);
    this.userService.get(this.controller, user.user_id).subscribe({
      next: (latestUser) => {
        if (this.selectedUser()?.user_id === latestUser.user_id) {
          this.selectedUser.set(latestUser);
          this.cd.markForCheck();
        }
      },
      error: (err) => {
        this.toasterService.error(err.error?.message || err.message || 'Failed to load user details');
        this.cd.markForCheck();
      },
    });
  }

  closeDetails(): void {
    this.selectedUser.set(null);
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      panelClass: ['base-dialog-panel', 'add-user-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.componentInstance.controller = this.controller;
    dialogRef.afterClosed().subscribe((changed) => {
      if (changed !== false) {
        this.refresh();
      }
    });
  }

  openUserDetailDialog(user: User): void {
    this.userService.get(this.controller, user.user_id).subscribe({
      next: (userData: User) => {
        const data: UserDetailDialogData = { user: userData, controller: this.controller };
        this.dialog
          .open(UserDetailDialogComponent, {
            panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
            data,
            disableClose: false,
          })
          .afterClosed()
          .subscribe(() => this.refresh());
      },
      error: (err) => {
        this.toasterService.error(err.error?.message || err.message || 'Failed to load user data');
        this.cd.markForCheck();
      },
    });
  }

  openAiProfileDialog(user: User): void {
    const data: AiProfileDialogData = { user, controller: this.controller };
    this.dialog.open(AiProfileDialogComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      data,
      disableClose: false,
    });
  }

  onDelete(user: User): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Delete user?',
          message: `User "${user.username}" will be permanently deleted.`,
          note: 'This action cannot be undone.',
          confirmButtonText: 'Delete user',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.userService.delete(this.controller, user.user_id).subscribe({
          next: () => {
            this.toasterService.success(`User "${user.username}" deleted.`);
            if (this.selectedUser()?.user_id === user.user_id) {
              this.closeDetails();
            }
            this.refresh();
          },
          error: (err) => {
            this.toasterService.error(err.error?.message || err.message || `Failed to delete user ${user.username}`);
            this.cd.markForCheck();
          },
        });
      });
  }

  deleteMultiple(): void {
    const users = [...this.selection.selected];
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Delete users?',
          message: `${users.length} selected users will be permanently deleted.`,
          details: users.map((user) => user.full_name ? `${user.username} (${user.full_name})` : user.username),
          note: 'This action cannot be undone.',
          confirmButtonText: 'Delete users',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        const completion = createActionCompletion(users.length, (count) => {
          if (count > 0) {
            this.toasterService.success(`${count} ${count === 1 ? 'user' : 'users'} deleted.`);
            this.refresh();
          }
        });
        users.forEach((user) => {
          this.userService.delete(this.controller, user.user_id).subscribe({
            next: () => completion.succeed(),
            error: (err) => {
              completion.fail();
              this.toasterService.error(err.error?.message || err.message || `Failed to delete user ${user.username}`);
              this.cd.markForCheck();
            },
          });
        });
      });
  }

  isAllSelected(): boolean {
    const visibleUsers = this.filteredUsers();
    return visibleUsers.length > 0 && visibleUsers.every((user) => this.selection.isSelected(user));
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.filteredUsers().forEach((user) => this.selection.deselect(user));
    } else {
      this.filteredUsers().forEach((user) => this.selection.select(user));
    }
  }

  roleLabel(user: User): string {
    return user.is_superadmin ? 'Administrator' : 'Standard user';
  }

  userInitials(user: User): string {
    const source = user.full_name?.trim() || user.username;
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  trackUser(_index: number, user: User): string {
    return user.user_id;
  }

  private sortValue(user: User, property: keyof User): string {
    if (property === 'is_active' || property === 'is_superadmin') {
      return user[property] ? '1' : '0';
    }
    return String(user[property] ?? '').toLowerCase();
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }

  private ensureValidPage(): void {
    const lastPage = Math.max(Math.ceil(this.filteredUsers().length / this.pageSize()) - 1, 0);
    if (this.pageIndex() > lastPage) {
      this.pageIndex.set(lastPage);
    }
  }

  private refreshSelectedUser(): void {
    const selectedId = this.selectedUser()?.user_id;
    if (!selectedId) {
      return;
    }
    this.selectedUser.set(this.users().find((user) => user.user_id === selectedId) ?? null);
  }
}
