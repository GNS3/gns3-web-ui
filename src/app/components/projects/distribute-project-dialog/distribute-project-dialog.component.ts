import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Project, isTerminalDistributionStatus } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ProjectDistributionService } from '@services/project-distribution.service';
import { ToasterService } from '@services/toaster.service';
import {
  RecipientPickerComponent,
  RecipientSelection,
  RecipientTargetMode,
} from '../recipient-picker/recipient-picker.component';

const EMPTY_SELECTION: RecipientSelection = { user: null, users: [], group: null };

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
    MatCheckboxModule,
    RecipientPickerComponent,
  ],
})
export class DistributeProjectDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DistributeProjectDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly distributionService = inject(ProjectDistributionService);
  private readonly toasterService = inject(ToasterService);
  private readonly cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;

  readonly copyName = signal('');
  readonly targetMode = signal<RecipientTargetMode>('user');
  readonly resetMacAddresses = signal(true);
  readonly lockTopology = signal(true);
  readonly isSubmitting = signal(false);
  /** The picker's current selection, mirrored on every change. */
  readonly recipientSelection = signal<RecipientSelection>(EMPTY_SELECTION);
  readonly recipientPicker = viewChild.required(RecipientPickerComponent);

  /** Copies are automatically suffixed with the recipient's username except in single-user mode. */
  readonly nameGetsSuffix = computed(() => this.targetMode() !== 'user');

  readonly canSubmit = computed(() => {
    if (this.isSubmitting() || !this.copyName().trim()) {
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

  /** Group-target hint of the shared picker (distribution semantics). */
  readonly groupHintFor = (group: string): string =>
    `Distributes to every member of "${group}" at the time of distribution.`;

  ngOnInit() {
    this.copyName.set(this.project.name);
    this.cd.markForCheck();

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
    const selection = this.recipientSelection();
    const targets =
      this.targetMode() === 'user'
        ? { target_user: selection.user ?? undefined, reset_mac_addresses: reset, lock_topology: lock }
        : this.targetMode() === 'users'
          ? {
              target_users: selection.users,
              reset_mac_addresses: reset,
              lock_topology: lock,
            }
          : { target_group: selection.group ?? undefined, reset_mac_addresses: reset, lock_topology: lock };

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
}
