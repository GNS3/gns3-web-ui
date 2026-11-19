import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import {
  Project,
  ProjectDistribution,
  ProjectDistributionResult,
  ProjectDistributionStatus,
  isTerminalDistributionStatus,
} from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { PermissionService } from '@services/permission.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

/**
 * History of a project's distributions: one entry per persisted
 * distribution job (newest first). The records are an event log — a copy
 * that was later deleted still counts — so the dialog states history, not
 * the current number of live copies.
 */
@Component({
  selector: 'app-distribution-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './distribution-history-dialog.component.html',
  styleUrl: './distribution-history-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistributionHistoryDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DistributionHistoryDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly permissionService = inject(PermissionService);
  private readonly toaster = inject(ToasterService);
  private readonly dialog = inject(MatDialog);

  /** Distribution jobs, or null while loading. */
  readonly records = signal<ProjectDistribution[] | null>(null);
  readonly loadFailed = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DistributionHistoryDialogData) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadFailed.set(false);
    this.records.set(null);
    this.projectService.listDistributions(this.data.controller, this.data.project.project_id).subscribe({
      next: (jobs) => this.records.set(jobs),
      error: () => this.loadFailed.set(true),
    });
  }

  /** Copies that actually exist for a job: results with a non-null project. */
  successfulCopies(job: ProjectDistribution): number {
    return job.results.filter((result) => result.project !== null).length;
  }

  /** Whether a distributed copy has been deleted since (unknown = no). */
  copyDeleted(result: { project: Project | null; project_exists?: boolean | null }): boolean {
    return result.project !== null && result.project_exists === false;
  }

  recipientTooltip(result: { project: Project | null; project_exists?: boolean | null; error: { message: string } | null }): string {
    if (!result.project) return result.error?.message || 'Failed';
    if (this.copyDeleted(result)) return 'Copy deleted';
    return 'Open the copy';
  }

  /** Copies of this distribution that still exist on the server. */
  liveCopies(job: ProjectDistribution): ProjectDistributionResult[] {
    return job.results.filter((result) => result.project !== null && result.project_exists !== false);
  }

  /** Deleting the copies is only possible on a finished job that still has some. */
  canDeleteCopies(job: ProjectDistribution): boolean {
    return isTerminalDistributionStatus(job.status) && this.liveCopies(job).length > 0;
  }

  /**
   * Tooltip of the record-delete action. The server refuses to remove a
   * record while a copy still exists (409 lists the holders), so the button
   * states why instead of failing silently.
   */
  recordDeleteTooltip(job: ProjectDistribution): string {
    const usernames = this.liveCopies(job).map((result) => result.username);
    if (usernames.length === 0) return 'Delete record';
    return `Copies still exist (${usernames.join(', ')}): delete them before removing the record`;
  }

  /**
   * Deletes every copy of a finished distribution that still exists. The
   * record is kept: it still tells who received a copy and when, and whether
   * that copy is gone.
   */
  deleteCopies(job: ProjectDistribution): void {
    const live = this.liveCopies(job);
    if (live.length === 0) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-danger-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete all copies?',
        message: `${live.length} existing ${live.length === 1 ? 'copy' : 'copies'} of "${job.name}" will be deleted from the recipients.`,
        note: 'Recipients lose their lab. The distribution record is kept.',
        confirmButtonText: 'Delete copies',
        tone: 'danger',
        icon: 'delete_sweep',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;
      this.projectService
        .deleteDistributionCopies(this.data.controller, this.data.project.project_id, job.distribution_id)
        .subscribe({
          next: (updated) => {
            // records can be null here: a concurrent action failed and its
            // reload (load()) is in flight — the reload owns the state, so
            // the late response must not map over null.
            this.records.update((jobs) =>
              jobs === null
                ? jobs
                : jobs.map((candidate) => (candidate.distribution_id === updated.distribution_id ? updated : candidate))
            );
            this.toaster.success(`Deleted ${live.length} distributed ${live.length === 1 ? 'copy' : 'copies'}.`);
          },
          error: (err) => {
            this.toaster.error(err.error?.message || err.message || 'Failed to delete the distributed copies');
          },
        });
    });
  }

  /** Whether any distribution in the history still has a live copy. */
  get hasAnyLiveCopy(): boolean {
    const jobs = this.records();
    return jobs === null ? true : jobs.some((job) => this.liveCopies(job).length > 0);
  }

  /** Unfreezing is reserved to the template owner and superadmins. */
  get canUnfreeze(): boolean {
    return (
      !!this.data.project.frozen &&
      (this.permissionService.isSuperadmin() || this.data.project.created_by === this.data.controller?.username)
    );
  }

  /** Unfreeze the template so it can be modified again (every copy must be gone). */
  unfreeze(): void {
    if (this.hasAnyLiveCopy) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-warning-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Unfreeze template?',
        message: `"${this.data.project.name}" becomes editable again. New copies will match any later changes.`,
        note: 'Distributing again freezes it until the new copies are deleted.',
        confirmButtonText: 'Unfreeze template',
        tone: 'warning',
        icon: 'lock_open',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;
      this.projectService.unfreeze(this.data.controller, this.data.project.project_id).subscribe({
        next: () => {
          this.toaster.success(`Project "${this.data.project.name}" unfrozen.`);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.toaster.error(err.error?.message || err.message || 'Failed to unfreeze the template');
        },
      });
    });
  }

  /**
   * Cancel (running) or delete the record of (finished) one distribution —
   * the same endpoint either way. A response body means the job was running
   * and got cancelled (update in place); null means the record was deleted
   * (reload). Errors reload and surface the reason: the server refuses to
   * remove a record while a copy still exists and lists the holders.
   */
  removeJob(job: ProjectDistribution): void {
    this.projectService
      .deleteDistribution(this.data.controller, this.data.project.project_id, job.distribution_id)
      .subscribe({
        next: (updated) => {
          if (updated) {
            // Null guard as in deleteCopies: a concurrent reload may own the state.
            this.records.update((jobs) =>
              jobs === null
                ? jobs
                : jobs.map((candidate) => (candidate.distribution_id === updated.distribution_id ? updated : candidate))
            );
          } else {
            this.load();
          }
        },
        error: (err) => {
          this.load();
          this.toaster.error(err.error?.message || err.message || 'Failed to update the distribution');
        },
      });
  }

  statusLabel(status: ProjectDistributionStatus): string {
    switch (status) {
      case 'running':
        return 'Running';
      case 'cancelling':
        return 'Cancelling';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}

export interface DistributionHistoryDialogData {
  controller: Controller;
  project: Project;
}
