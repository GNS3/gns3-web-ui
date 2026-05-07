import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { forkJoin, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-confirmation-delete-all-projects',
  templateUrl: './confirmation-delete-all-projects.component.html',
  styleUrl: './confirmation-delete-all-projects.component.scss',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDeleteAllProjectsComponent {
  public dialogRef = inject(MatDialogRef<ConfirmationDeleteAllProjectsComponent>);
  private projectService = inject(ProjectService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  isDelete = signal(false);
  isUsedFiles = signal(false);
  successfulDeletions = signal<any[]>([]);
  failedDeletions = signal<any[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public deleteData: any) {}

  async deleteAll() {
    this.isDelete.set(true);
    await this.deleteFile();
  }

  deleteFile() {
    // Wrap each request to handle errors independently
    // This prevents a single 403 from cancelling other pending requests
    const calls = this.deleteData.deleteFilesPaths.map((project, index) => {
      return this.projectService.delete(this.deleteData.controller, project.project_id).pipe(
        catchError((error) => {
          // Return error info instead of throwing, so forkJoin doesn't fail
          return of({ error: true, data: error, projectIndex: index });
        })
      );
    });

    forkJoin(calls).subscribe({
      next: (responses: any[]) => {
        const successful: any[] = [];
        const failed: any[] = [];

        responses.forEach((response, index) => {
          if (response && (response as any).error === true) {
            // Request failed with HTTP error (403, 404, etc.)
            failed.push({
              project: this.deleteData.deleteFilesPaths[index],
              error: (response as any).data
            });
          } else if (response === null || response === undefined) {
            // 204 No Content - successful deletion
            successful.push(this.deleteData.deleteFilesPaths[index]);
          } else {
            // Non-null response - treat as potential error
            failed.push({
              project: this.deleteData.deleteFilesPaths[index],
              error: response
            });
          }
        });

        this.successfulDeletions.set(successful);
        this.failedDeletions.set(failed);
        this.isUsedFiles.set(true);
        this.isDelete.set(true);
        this.cd.markForCheck();
      },
      error: (err) => {
        // This should rarely be reached since we handle errors per-request
        const message = err.error?.message || err.message || 'Failed to delete projects';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }
}
