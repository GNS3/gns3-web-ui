import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Project, isTerminalDistributionStatus } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ProjectDistributionService } from '@services/project-distribution.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';

type TargetMode = 'user' | 'users' | 'group';

@Component({
  selector: 'app-distribute-project-dialog',
  standalone: true,
  templateUrl: './distribute-project-dialog.component.html',
  styleUrls: ['./distribute-project-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatCheckboxModule,
  ],
})
export class DistributeProjectDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DistributeProjectDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly distributionService = inject(ProjectDistributionService);
  private readonly userService = inject(UserService);
  private readonly toasterService = inject(ToasterService);
  private readonly cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;

  readonly copyName = signal('');
  readonly targetMode = signal<TargetMode>('user');
  /** Usernames suggested as recipients: the union of the caller's group members. */
  readonly users = signal<string[]>([]);
  /** Names of the caller's own groups (whole-group distributions). */
  readonly groups = signal<string[]>([]);
  readonly resetMacAddresses = signal(true);
  readonly lockTopology = signal(true);
  readonly isLoadingTargets = signal(true);
  readonly targetsLoadError = signal('');
  readonly isSubmitting = signal(false);

  // Autocomplete filter text (free-typed, only picks from the panel count).
  readonly userFilter = signal('');
  readonly usersFilter = signal('');
  readonly groupFilter = signal('');

  // Effective selections (a selection only happens via optionSelected).
  readonly selectedUser = signal<string | null>(null);
  readonly selectedUsers = signal<string[]>([]);
  readonly selectedGroup = signal<string | null>(null);

  readonly filteredUsers = computed(() => this.filterUsers(this.userFilter()));
  readonly filteredUsersToAdd = computed(() =>
    this.filterUsers(this.usersFilter()).filter((username) => !this.selectedUsers().includes(username))
  );
  readonly filteredGroups = computed(() => {
    const filter = this.groupFilter().toLowerCase();
    return this.groups().filter((name) => name.toLowerCase().includes(filter));
  });

  /**
   * A typed username outside the caller's groups. The API accepts any
   * existing username (cross-group collaboration is allowed), so the picker
   * offers the typed value as an explicit option instead of dropping it.
   */
  readonly customUser = computed(() => this.customName(this.userFilter(), this.filteredUsers()));
  readonly customUserToAdd = computed(() => {
    const typed = this.customName(this.usersFilter(), this.filteredUsersToAdd());
    return typed !== null && !this.selectedUsers().includes(typed) ? typed : null;
  });

  /** Copies are automatically suffixed with the recipient's username except in single-user mode. */
  readonly nameGetsSuffix = computed(() => this.targetMode() !== 'user');

  readonly canSubmit = computed(() => {
    if (this.isSubmitting() || !this.copyName().trim()) {
      return false;
    }
    switch (this.targetMode()) {
      case 'user':
        return this.selectedUser() !== null;
      case 'users':
        return this.selectedUsers().length > 0;
      case 'group':
        return this.selectedGroup() !== null;
    }
  });

  ngOnInit() {
    this.copyName.set(this.project.name);
    this.cd.markForCheck();

    this.loadRecipients();

    // Best effort: resume tracking distributions of this project that are
    // still live server-side (e.g. started before a page refresh); jobs in
    // "cancelling" are live too — the in-flight copy is still finishing.
    this.projectService.listDistributions(this.controller, this.project.project_id).subscribe({
      next: (jobs) => {
        for (const job of jobs.filter((candidate) => !isTerminalDistributionStatus(candidate.status))) {
          this.distributionService.track(this.controller, job);
        }
      },
      error: () => undefined,
    });
  }

  displayUsername = (username: string | null): string => username ?? '';
  displayGroupName = (group: string | null): string => group ?? '';

  onUserFilterInput(value: string): void {
    this.userFilter.set(value);
    if (this.selectedUser() !== null && value !== this.selectedUser()) {
      this.selectedUser.set(null);
    }
  }

  onGroupFilterInput(value: string): void {
    this.groupFilter.set(value);
    if (this.selectedGroup() !== null && value !== this.selectedGroup()) {
      this.selectedGroup.set(null);
    }
  }

  selectUser(username: string): void {
    this.selectedUser.set(username);
    this.userFilter.set(username);
  }

  addUser(username: string): void {
    this.selectedUsers.update((previous) =>
      previous.includes(username) ? previous : [...previous, username]
    );
    this.usersFilter.set('');
  }

  removeUser(username: string): void {
    this.selectedUsers.update((previous) => previous.filter((selected) => selected !== username));
  }

  selectGroup(group: string): void {
    this.selectedGroup.set(group);
    this.groupFilter.set(group);
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }

  onSubmitClick(): void {
    if (!this.canSubmit() || this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.cd.markForCheck();

    const name = this.copyName().trim();
    const reset = this.resetMacAddresses();
    const lock = this.lockTopology();
    const targets =
      this.targetMode() === 'user'
        ? { target_user: this.selectedUser() ?? undefined, reset_mac_addresses: reset, lock_topology: lock }
        : this.targetMode() === 'users'
          ? {
              target_users: this.selectedUsers(),
              reset_mac_addresses: reset,
              lock_topology: lock,
            }
          : { target_group: this.selectedGroup() ?? undefined, reset_mac_addresses: reset, lock_topology: lock };

    this.projectService.distribute(this.controller, this.project.project_id, name, targets).subscribe({
      next: (job) => {
        // Copies are created in the background; the corner card follows the progress.
        this.distributionService.track(this.controller, job);
        this.dialogRef.close();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.cd.markForCheck();
        this.toasterService.error(err instanceof Error ? err.message : 'Failed to distribute project');
      },
    });
  }

  /**
   * Recipient suggestions come from GET /access/users/me/group-members
   * (User.GroupMembers): the members of the caller's own groups, usernames
   * only. The caller cannot be a distribution target (409: duplicating the
   * project is the supported way to get a copy for yourself), so the caller
   * never appears among the pickable users. Group targets are unaffected —
   * the server does not reject a group holding the caller.
   */
  private loadRecipients(): void {
    this.isLoadingTargets.set(true);
    this.targetsLoadError.set('');
    this.userService.getGroupMembers(this.controller).subscribe({
      next: ({ groups }) => {
        const members = new Set<string>();
        for (const group of groups) {
          for (const username of group.members) {
            members.add(username);
          }
        }
        members.delete(this.controller.username);
        this.users.set([...members].sort());
        this.groups.set(groups.map((group) => group.group_name).sort());
        this.isLoadingTargets.set(false);
        this.cd.markForCheck();
      },
      error: (err: unknown) => {
        this.isLoadingTargets.set(false);
        this.targetsLoadError.set(err instanceof Error ? err.message : 'Failed to load your group members');
        this.cd.markForCheck();
      },
    });
  }

  private filterUsers(filter: string): string[] {
    const value = filter.toLowerCase();
    return this.users().filter((username) => username.toLowerCase().includes(value));
  }

  /**
   * The typed value when it is a username the suggestion list does not
   * contain. The caller stays out — the server refuses them as a target
   * (409: duplicate the project instead), so hand-typing must not re-open it.
   */
  private customName(filter: string, candidates: string[]): string | null {
    const typed = filter.trim();
    if (typed.length === 0 || typed === this.controller.username || candidates.includes(typed)) {
      return null;
    }
    return typed;
  }
}
