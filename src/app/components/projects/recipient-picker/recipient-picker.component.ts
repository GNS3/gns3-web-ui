import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Controller } from '@models/controller';
import { UserService } from '@services/user.service';

export type RecipientTargetMode = 'user' | 'users' | 'group';

/** The effective recipient selection, reported to the host on every change. */
export interface RecipientSelection {
  user: string | null;
  users: string[];
  group: string | null;
}

/**
 * The recipient picker shared by the Share and Distribute dialogs: a single
 * user, multiple users (chips) or a whole user group, with autocomplete
 * suggestions from the caller's group members. The two dialogs used to
 * carry verbatim copies of this whole block.
 *
 * The picker owns the filters, the suggestion loading and the selection
 * state; the host owns the target-mode select (its placement differs per
 * dialog) and receives every change through `selectionChange`. `reset()`
 * clears the selection after a successful submit.
 */
@Component({
  selector: 'app-recipient-picker',
  templateUrl: './recipient-picker.component.html',
  styleUrl: './recipient-picker.component.scss',
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatChipsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipientPickerComponent implements OnInit {
  /** Controller the group members are read from. */
  readonly controller = input.required<Controller>();
  /**
   * Username the server refuses as a target (409): never suggested and
   * never accepted typed — the project owner for shares, the caller for
   * distributions.
   */
  readonly excludedUser = input.required<string>();
  /** Disabled while the host's request is in flight. */
  readonly disabled = input(false);
  /** Hint under a picked group — share and distribute semantics differ. */
  readonly groupHint = input.required<(group: string) => string>();

  /** Which kind of target is picked (two-way; the host renders the select). */
  readonly targetMode = model<RecipientTargetMode>('user');

  readonly selectionChange = output<RecipientSelection>();

  /** Usernames suggested as recipients: the union of the caller's group members. */
  readonly users = signal<string[]>([]);
  /** Names of the caller's own groups (whole-group targets). */
  readonly groups = signal<string[]>([]);
  readonly isLoadingTargets = signal(true);
  readonly targetsLoadError = signal('');

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
    this.filterUsers(this.usersFilter()).filter((username) => !this.selectedUsers().includes(username)),
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

  private readonly userService = inject(UserService);
  private readonly cd = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadRecipients();
  }

  displayUsername = (username: string | null): string => username ?? '';
  displayGroupName = (group: string | null): string => group ?? '';

  onUserFilterInput(value: string): void {
    this.userFilter.set(value);
    if (this.selectedUser() !== null && value !== this.selectedUser()) {
      this.selectedUser.set(null);
      this.emitSelection();
    }
  }

  onGroupFilterInput(value: string): void {
    this.groupFilter.set(value);
    if (this.selectedGroup() !== null && value !== this.selectedGroup()) {
      this.selectedGroup.set(null);
      this.emitSelection();
    }
  }

  selectUser(username: string): void {
    this.selectedUser.set(username);
    this.userFilter.set(username);
    this.emitSelection();
  }

  addUser(username: string): void {
    this.selectedUsers.update((previous) =>
      previous.includes(username) ? previous : [...previous, username],
    );
    this.usersFilter.set('');
    this.emitSelection();
  }

  removeUser(username: string): void {
    this.selectedUsers.update((previous) => previous.filter((selected) => selected !== username));
    this.emitSelection();
  }

  selectGroup(group: string): void {
    this.selectedGroup.set(group);
    this.groupFilter.set(group);
    this.emitSelection();
  }

  /** Clear the whole selection (the host calls this after a successful submit). */
  reset(): void {
    this.selectedUser.set(null);
    this.selectedUsers.set([]);
    this.selectedGroup.set(null);
    this.userFilter.set('');
    this.usersFilter.set('');
    this.groupFilter.set('');
    this.emitSelection();
  }

  /**
   * Recipient suggestions come from GET /access/users/me/group-members
   * (User.GroupMembers): the members of the caller's own groups, usernames
   * only. The excluded user (project owner for shares, the caller for
   * distributions) is dropped: the server answers 409 for them, so they
   * never appear among the pickable users. Group targets are unaffected —
   * a group ACE/distribution may legitimately include them.
   */
  private loadRecipients(): void {
    this.isLoadingTargets.set(true);
    this.targetsLoadError.set('');
    this.userService.getGroupMembers(this.controller()).subscribe({
      next: ({ groups }) => {
        const members = new Set<string>();
        for (const group of groups) {
          for (const username of group.members) {
            members.add(username);
          }
        }
        members.delete(this.excludedUser());
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

  private emitSelection(): void {
    this.selectionChange.emit({
      user: this.selectedUser(),
      users: [...this.selectedUsers()],
      group: this.selectedGroup(),
    });
  }

  private filterUsers(filter: string): string[] {
    const value = filter.toLowerCase();
    return this.users().filter((username) => username.toLowerCase().includes(value));
  }

  /**
   * The typed value when it is a username the suggestion list does not
   * contain. The excluded user stays out — the server refuses them as a
   * target (409), so hand-typing must not re-open them.
   */
  private customName(filter: string, candidates: string[]): string | null {
    const typed = filter.trim();
    if (typed.length === 0 || typed === this.excludedUser() || candidates.includes(typed)) {
      return null;
    }
    return typed;
  }
}
