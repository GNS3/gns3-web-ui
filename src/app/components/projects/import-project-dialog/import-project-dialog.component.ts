import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, computed, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ToasterService } from '@services/toaster.service';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ControllerResponse } from '@models/controllerResponse';
import { ProjectService } from '@services/project.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { UploadServiceService } from '../../../common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from '../../../common/uploading-processbar/uploading-processbar.component';

@Component({
  standalone: true,
  selector: 'app-import-project-dialog',
  templateUrl: 'import-project-dialog.component.html',
  styleUrls: ['import-project-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    FileUploadModule,
  ],
})
export class ImportProjectDialogComponent implements OnInit {
  private dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<ImportProjectDialogComponent>);
  private projectService = inject(ProjectService);
  private projectNameValidator = inject(ProjectNameValidator);
  private toasterService = inject(ToasterService);
  private uploadServiceService = inject(UploadServiceService);
  private snackBar = inject(MatSnackBar);
  readonly data = inject(MAT_DIALOG_DATA);

  uploader: FileUploader;
  controller: Controller;

  readonly uploadProgress = signal(0);
  readonly isImportEnabled = signal(false);
  readonly isFinishEnabled = signal(false);
  readonly isDeleteVisible = signal(false);
  readonly resultMessage = signal('The project is being imported... Please wait');
  readonly projectName = model('');
  readonly submitted = signal(false);
  readonly isFirstStepCompleted = signal(false);
  readonly uuid = signal('');

  readonly onImportProject = new EventEmitter<string>();

  readonly isNameEmpty = computed(() => {
    const name = this.projectName();
    return !name || name.trim().length === 0;
  });

  readonly isNameValid = computed(() => {
    const name = this.projectName();
    if (this.isNameEmpty()) {
      return false;
    }
    const validationError = this.projectNameValidator.get({ value: name });
    return !validationError;
  });

  readonly hasInvalidCharacters = computed(() => {
    const name = this.projectName();
    if (this.isNameEmpty()) {
      return false;
    }
    const validationError = this.projectNameValidator.get({ value: name });
    return validationError?.invalidName === true;
  });

  ngOnInit() {
    this.uploader = new FileUploader({ url: '' });
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      const controllerResponse: ControllerResponse = JSON.parse(response);
      this.resultMessage.set('An error has occurred: ' + controllerResponse.message);
      this.isFinishEnabled.set(true);
    };

    this.uploader.onCompleteItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.onImportProject.emit(this.uuid());
      this.resultMessage.set('Project was imported succesfully!');
      this.isFinishEnabled.set(true);
    };

    this.uploader.onProgressItem = (progress: any) => {
      this.uploadProgress.set(progress['progress']);
      this.uploadServiceService.processBarCount(this.uploadProgress());
    };

    this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading();
      }
    });
  }

  uploadProjectFile(event: any): void {
    this.projectName.set(event.target.files[0].name.split('.')[0]);
    this.isImportEnabled.set(true);
    this.isDeleteVisible.set(true);
  }

  onImportClick(): void {
    if (!this.isNameValid()) {
      this.submitted.set(true);
    } else {
      this.projectService.list(this.controller).subscribe({
        next: (projects: Project[]) => {
          const projectName = this.projectName().trim();
          const existingProject = projects.find((project) => project.name === projectName);

          if (existingProject) {
            this.openConfirmationDialog(existingProject);
          } else {
            this.importProject();
          }
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to list projects';
          this.toasterService.error(message);
        },
      });
    }
  }

  importProject(): void {
    const url = this.prepareUploadPath();
    this.uploader.queue.forEach((elem) => (elem.url = url));
    this.uploader.authToken = `Bearer ${this.controller.authToken}`;
    this.isFirstStepCompleted.set(true);
    const itemToUpload = this.uploader.queue[0];
    this.uploader.uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data: { upload_file_type: 'Project' },
    });
  }

  openConfirmationDialog(existingProject: Project): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      height: '150px',
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
      data: {
        existingProject: existingProject,
      },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((answer: boolean) => {
      if (answer) {
        this.projectService.close(this.controller, existingProject.project_id).subscribe({
          next: () => {
            this.projectService.delete(this.controller, existingProject.project_id).subscribe({
              next: () => {
                this.importProject();
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to delete project';
                this.toasterService.error(message);
              },
            });
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to close project';
            this.toasterService.error(message);
          },
        });
      }
    });
  }

  onNoClick(): void {
    this.uploader.cancelAll();
    this.dialogRef.close(false);
  }

  onFinishClick(): void {
    this.dialogRef.close(false);
  }

  onDeleteClick(): void {
    this.uploader.queue.pop();
    this.isImportEnabled.set(false);
    this.isDeleteVisible.set(false);
    this.projectName.set('');
  }

  prepareUploadPath(): string {
    this.uuid.set(crypto.randomUUID());
    const projectName = this.projectName().trim();
    return this.projectService.getUploadPath(this.controller, this.uuid(), projectName);
  }

  cancelUploading(): void {
    this.uploader.clearQueue();
    this.uploadServiceService.processBarCount(null);
    this.toasterService.warning('File upload cancelled');
    this.uploadServiceService.cancelFileUploading(false);
    this.isFirstStepCompleted.set(false);
    this.uploader.cancelAll();
    this.dialogRef.close(true);
  }
}
