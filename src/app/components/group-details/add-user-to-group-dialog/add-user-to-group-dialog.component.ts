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
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService } from '@services/user.service';
import { Controller } from '@models/controller';
import { BehaviorSubject, forkJoin, observable, Observable, timer } from 'rxjs';
import { User } from '@models/users/user';
import { GroupService } from '@services/group.service';
import { Group } from '@models/groups/group';
import { tap } from 'rxjs/operators';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-add-user-to-group-dialog',
  templateUrl: './add-user-to-group-dialog.component.html',
  styleUrl: './add-user-to-group-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
})
export class AddUserToGroupDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddUserToGroupDialogComponent>);
  private userService = inject(UserService);
  private groupService = inject(GroupService);
  private toastService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  users = new BehaviorSubject<User[]>([]);
  displayedUsers = new BehaviorSubject<User[]>([]);

  readonly searchText = model('');
  loading = false;

  // Batch selection state
  selectedUserIds = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedUserIds().size);
  allSelected = computed(() => {
    const displayed = this.displayedUsers.value;
    return displayed.length > 0 && displayed.every((user) => this.selectedUserIds().has(user.user_id));
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { controller: Controller; group: Group }) {}

  ngOnInit(): void {
    this.getUsers();
  }

  onSearch() {
    timer(500).subscribe(() => {
      const displayedUsers = this.users.value.filter((user: User) => {
        return user.username.includes(this.searchText()) || user.email?.includes(this.searchText());
      });

      this.displayedUsers.next(displayedUsers);
      this.cd.markForCheck();
    });
  }

  getUsers() {
    forkJoin([
      this.userService.list(this.data.controller),
      this.groupService.getGroupMember(this.data.controller, this.data.group.user_group_id),
    ]).subscribe((results) => {
      const [userList, members] = results;
      const users = userList.filter((user: User) => {
        return !members.find((u: User) => u.user_id === user.user_id);
      });

      this.users.next(users);
      this.displayedUsers.next(users);
      this.cd.markForCheck();
    });
  }

  addUser(user: User) {
    this.loading = true;
    this.groupService.addMemberToGroup(this.data.controller, this.data.group, user).subscribe(
      () => {
        this.toastService.success(`user ${user.username} was added`);
        // Remove from displayed users and deselect
        this.removeUserFromList(user);
        this.selectedUserIds.update((set) => {
          const newSet = new Set(set);
          newSet.delete(user.user_id);
          return newSet;
        });
        this.loading = false;
        this.cd.markForCheck();
      },
      (err) => {
        console.log(err);
        this.toastService.error(`error while adding user ${user.username} to group ${this.data.group.name}`);
        this.loading = false;
        this.cd.markForCheck();
      }
    );
  }

  toggleUserSelection(userId: string): void {
    this.selectedUserIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds().has(userId);
  }

  toggleSelectAll(): void {
    const displayed = this.displayedUsers.value;
    const currentSet = this.selectedUserIds();

    if (this.allSelected()) {
      // Deselect all
      this.selectedUserIds.set(new Set());
    } else {
      // Select all displayed
      const newSet = new Set(currentSet);
      displayed.forEach((user) => newSet.add(user.user_id));
      this.selectedUserIds.set(newSet);
    }
  }

  addSelectedUsers(): void {
    const selectedIds = this.selectedUserIds();
    if (selectedIds.size === 0) {
      this.toastService.warning('Please select at least one user');
      return;
    }

    const usersToAdd = this.displayedUsers.value.filter((user) => selectedIds.has(user.user_id));
    this.loading = true;

    // Batch add users
    forkJoin(
      usersToAdd.map((user) => this.groupService.addMemberToGroup(this.data.controller, this.data.group, user))
    ).subscribe({
      next: () => {
        this.toastService.success(`${usersToAdd.length} user(s) added to group`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.log(err);
        this.toastService.error('Error adding users to group');
        this.loading = false;
        this.cd.markForCheck();
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private removeUserFromList(user: User): void {
    const currentUsers = this.users.value;
    const currentDisplayed = this.displayedUsers.value;

    this.users.next(currentUsers.filter((u) => u.user_id !== user.user_id));
    this.displayedUsers.next(currentDisplayed.filter((u) => u.user_id !== user.user_id));
  }
}
