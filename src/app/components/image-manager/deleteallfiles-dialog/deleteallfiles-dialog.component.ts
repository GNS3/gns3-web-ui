import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageManagerService } from '@services/image-manager.service';
import { ToasterService } from '@services/toaster.service';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImageData } from '@models/images';

@Component({
  standalone: true,
  selector: 'app-deleteallfiles-dialog',
  templateUrl: './deleteallfiles-dialog.component.html',
  styleUrls: ['./deleteallfiles-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
})
export class DeleteAllImageFilesDialogComponent {
  private imageService = inject(ImageManagerService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  isDelete: boolean = false;
  isUsedFiles: boolean = false;
  deleteFliesDetails: ImageData = [];
  fileNotDeleted: ImageData = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public deleteData: any,
    public dialogRef: MatDialogRef<DeleteAllImageFilesDialogComponent>
  ) {}

  async deleteAll() {
    this.isDelete = true;
    await this.deleteFile();
  }

  deleteFile() {
    const calls = [];
    this.deleteData.deleteFilesPaths.forEach((pathElement) => {
      calls.push(
        this.imageService
          .deleteFile(this.deleteData.controller, pathElement.filename)
          .pipe(catchError((error) => of(error)))
      );
    });
    forkJoin(calls).subscribe({
      next: (responses) => {
        this.deleteFliesDetails = responses.filter((x) => x !== null);
        this.fileNotDeleted = responses.filter((x) => x === null);
        this.isUsedFiles = true;
        this.isDelete = true;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to delete files';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }
}
