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
import { ProgressDialogComponent } from '../../../common/progress-dialog/progress-dialog.component';
import { ProgressDialogService } from '../../../common/progress-dialog/progress-dialog.service';
import { ToasterService } from '@services/toaster.service';
import { CreateSnapshotDialogComponent } from '../create-snapshot-dialog/create-snapshot-dialog.component';
import { QuestionDialogComponent } from '@components/dialogs/question-dialog/question-dialog.component';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotDialogComponent {
  private dialogRef = inject(MatDialogRef<SnapshotDialogComponent>);
  private snapshotService = inject(SnapshotService);
  private progressDialogService = inject(ProgressDialogService);
  private toaster = inject(ToasterService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  snapshots = model<Snapshot[]>([]);
  searchText = model('');
  displayedColumns = ['name', 'created_at', 'actions'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.controller = data['controller'];
    this.project = data['project'];
    this.loadSnapshots();
  }

  filteredSnapshots = computed(() => {
    const filter = this.searchText().toLowerCase();
    if (!filter) return this.snapshots();
    return this.snapshots().filter((s) => s.name.toLowerCase().includes(filter));
  });

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateSnapshotDialogComponent, {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      data: {
        controller: this.controller,
        project: this.project,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((snapshot: Snapshot) => {
      if (snapshot) {
        const progress = this.progressDialogService.open();
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

  restoreSnapshot(snapshot: Snapshot) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      data: {
        title: 'Restore snapshot',
        question: `Are you sure you want to restore snapshot "${snapshot.name}"? This will replace your current topology.`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;

      const progress = this.progressDialogService.open();
      const subscription = this.snapshotService
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

      progress.afterClosed().subscribe((result) => {
        if (result === ProgressDialogComponent.CANCELLED) {
          subscription.unsubscribe();
        }
      });
    });
  }

  deleteSnapshot(snapshot: Snapshot) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      data: {
        title: 'Delete snapshot',
        question: `Are you sure you want to delete snapshot "${snapshot.name}"?`,
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
