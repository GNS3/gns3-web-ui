import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ToasterService } from '@services/toaster.service';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { v4 as uuid } from 'uuid';
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
  providers: [ProjectNameValidator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  private formBuilder = inject(UntypedFormBuilder);
  private projectService = inject(ProjectService);
  private projectNameValidator = inject(ProjectNameValidator);
  private toasterService = inject(ToasterService);
  private uploadServiceService = inject(UploadServiceService);
  private snackBar = inject(MatSnackBar);
  private cd = inject(ChangeDetectorRef);

  @Inject(MAT_DIALOG_DATA) public data: any;

  uploader: FileUploader;
  uploadProgress: number = 0;
  controller: Controller;
  isImportEnabled: boolean = false;
  isFinishEnabled: boolean = false;
  isDeleteVisible: boolean = false;
  resultMessage: string = 'The project is being imported... Please wait';
  projectNameForm: UntypedFormGroup;
  submitted: boolean = false;
  isFirstStepCompleted: boolean = false;
  uuid: string;
  onImportProject = new EventEmitter<string>();

  constructor() {
    this.projectNameForm = this.formBuilder.group({
      projectName: new UntypedFormControl(null, [Validators.required, this.projectNameValidator.get]),
    });
  }

  ngOnInit() {
    this.uploader = new FileUploader({ url: '' });
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      let controllerResponse: ControllerResponse = JSON.parse(response);
      this.resultMessage = 'An error has occurred: ' + controllerResponse.message;
      this.isFinishEnabled = true;
      this.cd.markForCheck();
    };

    this.uploader.onCompleteItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.onImportProject.emit(this.uuid);
      this.resultMessage = 'Project was imported succesfully!';
      this.isFinishEnabled = true;
      this.cd.markForCheck();
    };
    this.uploader.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress);
      this.cd.markForCheck();
    };

    this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading();
      }
    });
  }

  get form() {
    return this.projectNameForm.controls;
  }

  uploadProjectFile(event): void {
    this.projectNameForm.controls['projectName'].setValue(event.target.files[0].name.split('.')[0]);
    this.isImportEnabled = true;
    this.isDeleteVisible = true;
    this.cd.markForCheck();
  }

  onImportClick(): void {
    if (this.projectNameForm.invalid) {
      this.submitted = true;
    } else {
      this.projectService.list(this.controller).subscribe((projects: Project[]) => {
        const projectName = this.projectNameForm.controls['projectName'].value;
        let existingProject = projects.find((project) => project.name === projectName);

        if (existingProject) {
          this.openConfirmationDialog(existingProject);
        } else {
          this.importProject();
        }
        this.cd.markForCheck();
      });
    }
  }

  importProject() {
    const url = this.prepareUploadPath();
    this.uploader.queue.forEach((elem) => (elem.url = url));
    this.uploader.authToken = `Bearer ${this.controller.authToken}`;
    this.isFirstStepCompleted = true;
    const itemToUpload = this.uploader.queue[0];
    this.uploader.uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data: { upload_file_type: 'Project' },
    });
  }

  openConfirmationDialog(existingProject: Project) {
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
        this.projectService.close(this.controller, existingProject.project_id).subscribe(() => {
          this.projectService.delete(this.controller, existingProject.project_id).subscribe(() => {
            this.importProject();
          });
        });
      }
      this.cd.markForCheck();
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
    this.isImportEnabled = false;
    this.isDeleteVisible = false;
    this.projectNameForm.controls['projectName'].setValue('');
    this.cd.markForCheck();
  }

  prepareUploadPath(): string {
    this.uuid = uuid();
    const projectName = this.projectNameForm.controls['projectName'].value;
    return this.projectService.getUploadPath(this.controller, this.uuid, projectName);
  }

  cancelUploading() {
    this.uploader.clearQueue();
    this.uploadServiceService.processBarCount(null);
    this.toasterService.warning('File upload cancelled');
    this.uploadServiceService.cancelFileUploading(false);
    this.isFirstStepCompleted = false;
    this.uploader.cancelAll();
    this.dialogRef.close(true);
  }
}
