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
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Project, ProjectShare } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';

type TargetMode = 'user' | 'users' | 'group';

/**
 * Curated share roles (exact server role names). The full role list stays
 * out on purpose: the server rejects roles the sharer does not hold on the
 * project, so a free-form list would only widen the 403 surface.
 */
const SHARE_ROLES: readonly { name: string; description: string }[] = [
  { name: 'Lab member', description: 'Recipients can open and use the project but cannot change its topology.' },
  { name: 'User', description: 'Recipients fully collaborate on the project, topology included.' },
];

@Component({
  selector: 'app-share-project-dialog',
  standalone: true,
  templateUrl: './share-project-dialog.component.html',
  styleUrls: ['./share-project-dialog.component.scss'],
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
    MatDividerModule,
    MatTooltipModule,
  ],
})
export class ShareProjectDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ShareProjectDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly userService = inject(UserService);
  private readonly toasterService = inject(ToasterService);
  private readonly cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;

  readonly shareRoles = SHARE_ROLES;

  readonly targetMode = signal<TargetMode>('user');
  readonly role = signal(SHARE_ROLES[0].name);
  /** Usernames suggested as recipients: the union of the caller's group members. */
  readonly users = signal<string[]>([]);
  /** Names of the caller's own groups (whole-group shares). */
  readonly groups = signal<string[]>([]);
  readonly isLoadingTargets = signal(true);
  readonly targetsLoadError = signal('');
  readonly isSubmitting = signal(false);

  readonly shares = signal<ProjectShare[]>([]);
  readonly isLoadingShares = signal(true);
  readonly sharesLoadError = signal('');
  readonly removingAceId = signal<string | null>(null);

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

  readonly roleDescription = computed(
    () => SHARE_ROLES.find((candidate) => candidate.name === this.role())?.description ?? ''
  );

  readonly canSubmit = computed(() => {
    if (this.isSubmitting()) {
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
    this.loadShares();
    this.loadRecipients();
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

    const targets =
      this.targetMode() === 'user'
        ? { target_user: this.selectedUser() ?? undefined, role: this.role() }
        : this.targetMode() === 'users'
          ? { target_users: this.selectedUsers(), role: this.role() }
          : { target_group: this.selectedGroup() ?? undefined, role: this.role() };

    this.projectService.share(this.controller, this.project.project_id, targets).subscribe({
      next: (shares) => {
        // Sharing is instant (201): summarize, refresh the list and let the
        // dialog stay open for further shares or removals.
        const names = shares.map((share) => share.username ?? share.group_name ?? '');
        const summary = names.length === 1 ? names[0] : `${names.length} recipients`;
        this.toasterService.success(`Shared "${this.project.name}" with ${summary}`);

        this.resetTargets();
        this.isSubmitting.set(false);
        this.loadShares();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.cd.markForCheck();
        this.toasterService.error(err instanceof Error ? err.message : 'Failed to share project');
      },
    });
  }

  removeShare(share: ProjectShare): void {
    if (this.removingAceId() !== null) {
      return;
    }
    this.removingAceId.set(share.ace_id);
    this.cd.markForCheck();

    this.projectService.removeShare(this.controller, this.project.project_id, share.ace_id).subscribe({
      next: () => {
        this.shares.update((previous) => previous.filter((candidate) => candidate.ace_id !== share.ace_id));
        this.removingAceId.set(null);
        this.cd.markForCheck();
      },
      error: (err: unknown) => {
        this.removingAceId.set(null);
        this.cd.markForCheck();
        this.toasterService.error(err instanceof Error ? err.message : 'Failed to remove share');
      },
    });
  }

  private loadShares(): void {
    this.isLoadingShares.set(true);
    this.sharesLoadError.set('');
    this.projectService.listShares(this.controller, this.project.project_id).subscribe({
      next: (shares) => {
        this.shares.set(shares);
        this.isLoadingShares.set(false);
        this.cd.markForCheck();
      },
      error: (err: unknown) => {
        this.isLoadingShares.set(false);
        this.sharesLoadError.set(err instanceof Error ? err.message : 'Failed to load the shares');
        this.cd.markForCheck();
      },
    });
  }

  /**
   * Recipient suggestions come from GET /access/users/me/group-members
   * (User.GroupMembers): the members of the caller's own groups, usernames
   * only. The project owner cannot be a share target (409: the share upsert
   * would replace the owner ACE and its role), so they never appear among
   * the pickable users. Group shares are unaffected — they write a group ACE
   * that leaves the owner ACE alone.
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
        members.delete(this.project.created_by);
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

  private resetTargets(): void {
    this.selectedUser.set(null);
    this.selectedUsers.set([]);
    this.selectedGroup.set(null);
    this.userFilter.set('');
    this.usersFilter.set('');
    this.groupFilter.set('');
  }

  private filterUsers(filter: string): string[] {
    const value = filter.toLowerCase();
    return this.users().filter((username) => username.toLowerCase().includes(value));
  }

  /**
   * The typed value when it is a username the suggestion list does not
   * contain. The project owner stays out — the server refuses them as a
   * share target (409), so hand-typing the name must not re-open it.
   */
  private customName(filter: string, candidates: string[]): string | null {
    const typed = filter.trim();
    if (typed.length === 0 || typed === this.project.created_by || candidates.includes(typed)) {
      return null;
    }
    return typed;
  }
}
