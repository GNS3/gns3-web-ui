import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageManagerService } from '@services/image-manager.service';
import { DockerService } from '@services/docker.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-deleteallfiles-dialog',
  templateUrl: './deleteallfiles-dialog.component.html',
  styleUrls: ['./deleteallfiles-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
})
export class DeleteAllImageFilesDialogComponent implements OnInit {
  private imageService = inject(ImageManagerService);
  private dockerService = inject(DockerService);
  private cd = inject(ChangeDetectorRef);

  isDelete: boolean = true;
  isUsedFiles: boolean = false;
  failedMessages: string[] = [];
  deletedCount = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public deleteData: any,
    public dialogRef: MatDialogRef<DeleteAllImageFilesDialogComponent>
  ) {}

  ngOnInit(): void {
    if (this.deleteData.autoStart !== false) {
      this.deleteFile();
    }
  }

  async deleteAll() {
    this.isDelete = true;
    await this.deleteFile();
  }

  deleteFile() {
    // each call resolves to null on success (204 No Content) or to an error object
    const calls: Observable<any>[] = this.deleteData.deleteFilesPaths.map((row) => {
      if (row?.rowType === 'docker' && row.dockerImage) {
        // Docker images are deleted from the daemon. A 409 means a container
        // still uses the image: keep it and report the server message.
        return this.dockerService
          .deleteImage(this.deleteData.controller, this.deleteData.computeId ?? 'local', row.dockerImage, false)
          .pipe(
            map(() => null),
            catchError((error) => of(error))
          );
      }
      return this.imageService
        .deleteFile(this.deleteData.controller, row.filename)
        .pipe(catchError((error) => of(error)));
    });
    forkJoin(calls).subscribe({
      next: (responses) => {
        // A successful DELETE returns 204 No Content (null body). Failed requests emit an
        // error object: HttpController converts HTTP errors to ControllerError whose
        // message is the server message, while a raw HttpErrorResponse keeps it in
        // error.message. Both shapes are handled below.
        this.deletedCount = responses.filter((response) => response === null).length;
        this.failedMessages = responses
          .filter((response) => response !== null)
          .map((response) => response?.error?.message || response?.message || 'Failed to delete image');
        this.isUsedFiles = true;
        this.isDelete = true;
        this.cd.markForCheck();
      },
    });
  }
}
