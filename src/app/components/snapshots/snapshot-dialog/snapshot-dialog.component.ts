import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Snapshot } from '@models/snapshot';
import { SnapshotService } from '@services/snapshot.service';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { ToasterService } from '@services/toaster.service';
import { ProjectPermissionService } from '@services/project-permission.service';
import { HasProjectPrivilegeDirective } from '@directives/has-project-privilege.directive';
import { CreateSnapshotDialogComponent } from '../create-snapshot-dialog/create-snapshot-dialog.component';
import { EditSnapshotDialogComponent } from '../edit-snapshot-dialog/edit-snapshot-dialog.component';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { DateFilter } from '@filters/dateFilter.pipe';

@Component({
  selector: 'app-snapshot-dialog',
  standalone: true,
  templateUrl: './snapshot-dialog.component.html',
  styleUrl: './snapshot-dialog.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    DateFilter,
    HasProjectPrivilegeDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotDialogComponent {
  private dialogRef = inject(MatDialogRef<SnapshotDialogComponent>);
  private snapshotService = inject(SnapshotService);
  private progressDialogService = inject(ProgressDialogService);
  private toaster = inject(ToasterService);
  private projectPermissionService = inject(ProjectPermissionService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  snapshots = model<Snapshot[]>([]);
  searchText = model('');
  /** The actions column renders only when at least one of its buttons does —
   *  without Snapshot.Allocate or Snapshot.Restore it would be an empty column.
   *  A frozen template refuses Restore; edit and delete (both Allocate) remain. */
  displayedColumns = computed(() =>
    (this.project?.frozen
      ? this.projectPermissionService.has('Snapshot.Allocate')
      : this.projectPermissionService.hasAny(['Snapshot.Allocate', 'Snapshot.Restore']))
      ? ['name', 'created_at', 'actions']
      : ['name', 'created_at']
  );

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.controller = data['controller'];
    this.project = data['project'];
    this.loadSnapshots();
  }

  filteredSnapshots = computed(() => {
    const filter = this.searchText().toLowerCase();
    if (!filter) return this.snapshots();
    return this.snapshots().filter(
      (s) => s.name.toLowerCase().includes(filter) || (s.description ?? '').toLowerCase().includes(filter),
    );
  });

  /** The server fills every snapshot's description with
   *  "Snapshot '<name>' taken on <date>" when the user provides none — showing
   *  that under the name would just repeat the Name and Date columns. */
  hasCustomDescription(snapshot: Snapshot): boolean {
    const description = snapshot.description;
    return !!description && !description.startsWith(`Snapshot '${snapshot.name}' taken on `);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateSnapshotDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel'],
      data: {
        controller: this.controller,
        project: this.project,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((snapshot: Snapshot) => {
      if (snapshot) {
        // Snapshot creation runs server-side and cannot be cancelled, so the
        // progress dialog only hides the wait: closing it leaves the request
        // running and the result still arrives via toaster + list reload.
        const progress = this.progressDialogService.open({
          title: 'Creating snapshot',
          message: `Creating snapshot '${snapshot.name}'. The server is saving the current project state.`,
          backgroundHint: 'Snapshots cannot be cancelled once started.',
        });
        this.snapshotService.create(this.controller, this.project.project_id, snapshot).subscribe({
          next: () => {
            progress.close();
            this.loadSnapshots();
            this.toaster.success(`Snapshot '${snapshot.name}' has been created.`);
          },
          error: (err) => {
            progress.close();
            const errorMessage = err.error?.message || err.message || 'Unknown error';
            this.toaster.error(`Failed to create snapshot: ${errorMessage}`);
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  editSnapshot(snapshot: Snapshot) {
    const dialogRef = this.dialog.open(EditSnapshotDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel'],
      data: { snapshot },
    });

    dialogRef.afterClosed().subscribe((description: string) => {
      // an empty string is a valid result: it resets the description server-side
      if (description === undefined) return;

      this.snapshotService
        .update(this.controller, this.project.project_id, snapshot.snapshot_id, description)
        .subscribe({
          next: () => {
            this.loadSnapshots();
            this.toaster.success(`Description of "${snapshot.name}" has been updated.`);
            this.cd.markForCheck();
          },
          error: (err) => {
            const errorMessage = err.error?.message || err.message || 'Unknown error';
            this.toaster.error(`Failed to update description: ${errorMessage}`);
            this.cd.markForCheck();
          },
        });
    });
  }

  restoreSnapshot(snapshot: Snapshot) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Restore snapshot?',
        message: `Restoring "${snapshot.name}" will replace the current topology.`,
        note: 'A restore cannot be cancelled once started.',
        confirmButtonText: 'Restore snapshot',
        tone: 'warning',
        icon: 'restore',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;

      // Like creation, a restore runs server-side and cannot be cancelled;
      // closing the progress dialog just hides the wait.
      const progress = this.progressDialogService.open({
        title: 'Restoring snapshot',
        message: `Restoring snapshot '${snapshot.name}'. The current topology will be replaced when it finishes.`,
        backgroundHint: 'A restore cannot be cancelled once started.',
      });
      this.snapshotService
        .restore(this.controller, this.project.project_id, snapshot.snapshot_id)
        .subscribe({
          next: () => {
            this.toaster.success(`Snapshot "${snapshot.name}" has been restored.`);
            progress.close();
            this.cd.markForCheck();
          },
          error: (err) => {
            progress.close();
            const errorMessage = err.error?.message || err.message || 'Unknown error';
            this.toaster.error(`Failed to restore snapshot: ${errorMessage}`);
            this.cd.markForCheck();
          },
        });
    });
  }

  deleteSnapshot(snapshot: Snapshot) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete snapshot?',
        message: `Snapshot "${snapshot.name}" will be permanently deleted.`,
        note: 'This action cannot be undone.',
        confirmButtonText: 'Delete snapshot',
        tone: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;

      this.snapshotService.delete(this.controller, this.project.project_id, snapshot.snapshot_id).subscribe({
        next: () => {
          this.loadSnapshots();
          this.toaster.success(`Snapshot "${snapshot.name}" has been deleted.`);
          this.cd.markForCheck();
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Unknown error';
          this.toaster.error(`Failed to delete snapshot: ${errorMessage}`);
          this.cd.markForCheck();
        },
      });
    });
  }

  private loadSnapshots() {
    this.snapshotService.list(this.controller, this.project.project_id).subscribe({
      next: (snapshots) => {
        this.snapshots.set(snapshots);
        this.cd.markForCheck();
      },
      error: (err) => {
        const errorMessage = err.error?.message || err.message || 'Unknown error';
        this.toaster.error(`Failed to load snapshots: ${errorMessage}`);
        this.cd.markForCheck();
      },
    });
  }
}
