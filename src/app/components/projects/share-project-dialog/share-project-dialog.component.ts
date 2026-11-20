import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Project, ProjectShare } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import {
  RecipientPickerComponent,
  RecipientSelection,
  RecipientTargetMode,
} from '../recipient-picker/recipient-picker.component';

/**
 * Curated share roles (exact server role names). The full role list stays
 * out on purpose: the server rejects roles the sharer does not hold on the
 * project, so a free-form list would only widen the 403 surface.
 */
const SHARE_ROLES: readonly { name: string; description: string }[] = [
  { name: 'Lab member', description: 'Recipients can open and use the project but cannot change its topology.' },
  { name: 'User', description: 'Recipients fully collaborate on the project, topology included.' },
];

const EMPTY_SELECTION: RecipientSelection = { user: null, users: [], group: null };

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
    MatDividerModule,
    MatTooltipModule,
    RecipientPickerComponent,
  ],
})
export class ShareProjectDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ShareProjectDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly toasterService = inject(ToasterService);
  private readonly cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;

  readonly shareRoles = SHARE_ROLES;

  readonly targetMode = signal<RecipientTargetMode>('user');
  readonly role = signal(SHARE_ROLES[0].name);
  readonly isSubmitting = signal(false);
  /** The picker's current selection, mirrored on every change. */
  readonly recipientSelection = signal<RecipientSelection>(EMPTY_SELECTION);
  readonly recipientPicker = viewChild.required(RecipientPickerComponent);

  readonly shares = signal<ProjectShare[]>([]);
  readonly isLoadingShares = signal(true);
  readonly sharesLoadError = signal('');
  readonly removingAceId = signal<string | null>(null);

  readonly roleDescription = computed(
    () => SHARE_ROLES.find((candidate) => candidate.name === this.role())?.description ?? '',
  );

  readonly canSubmit = computed(() => {
    if (this.isSubmitting()) {
      return false;
    }
    const selection = this.recipientSelection();
    switch (this.targetMode()) {
      case 'user':
        return selection.user !== null;
      case 'users':
        return selection.users.length > 0;
      case 'group':
        return selection.group !== null;
    }
  });

  /** Group-target hint of the shared picker (share semantics). */
  readonly groupHintFor = (group: string): string =>
    `Everyone in "${group}" gains access — including people joining the group later.`;

  ngOnInit() {
    this.loadShares();
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

    const selection = this.recipientSelection();
    const targets =
      this.targetMode() === 'user'
        ? { target_user: selection.user ?? undefined, role: this.role() }
        : this.targetMode() === 'users'
          ? { target_users: selection.users, role: this.role() }
          : { target_group: selection.group ?? undefined, role: this.role() };

    this.projectService.share(this.controller, this.project.project_id, targets).subscribe({
      next: (shares) => {
        // Sharing is instant (201): summarize, refresh the list and let the
        // dialog stay open for further shares or removals.
        const names = shares.map((share) => share.username ?? share.group_name ?? '');
        const summary = names.length === 1 ? names[0] : `${names.length} recipients`;
        this.toasterService.success(`Shared "${this.project.name}" with ${summary}`);

        this.recipientPicker().reset();
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
}
