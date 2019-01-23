import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { FileUploader, ParsedResponseHeaders, FileItem } from 'ng2-file-upload';
import { Server } from '../../../models/server';
import { v4 as uuid } from 'uuid';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ServerResponse } from '../../../models/serverResponse';
import { ProjectNameValidator } from '../models/projectNameValidator';

@Component({
  selector: 'app-import-project-dialog',
  templateUrl: 'import-project-dialog.component.html',
  styleUrls: ['import-project-dialog.component.css'],
  providers: [ProjectNameValidator]
})
export class ImportProjectDialogComponent implements OnInit {
  uploader: FileUploader;
  server: Server;
  isImportEnabled: boolean = false;
  isFinishEnabled: boolean = false;
  isDeleteVisible: boolean = false;
  resultMessage: string = 'The project is being imported... Please wait';
  projectNameForm: FormGroup;
  submitted: boolean = false;
  isFirstStepCompleted: boolean = false;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ImportProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private projectNameValidator: ProjectNameValidator
  ) {
    this.projectNameForm = this.formBuilder.group({
      projectName: new FormControl(null, [Validators.required, projectNameValidator.get])
    });
  }

  ngOnInit() {
    this.uploader = new FileUploader({});
    this.uploader.onAfterAddingFile = file => {
      file.withCredentials = false;
    };

    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      let serverResponse: ServerResponse = JSON.parse(response);
      this.resultMessage = 'An error occured: ' + serverResponse.message;
      this.isFinishEnabled = true;
    };

    this.uploader.onCompleteItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.resultMessage = 'Project was imported succesfully!';
      this.isFinishEnabled = true;
    };
  }

  get form() {
    return this.projectNameForm.controls;
  }

  uploadProjectFile(event): void {
    this.projectNameForm.controls['projectName'].setValue(event.target.files[0].name.split('.')[0]);
    this.isImportEnabled = true;
    this.isDeleteVisible = true;
  }

  onImportClick(): void {
    if (this.projectNameForm.invalid) {
      this.submitted = true;
    } else {
      this.projectService.list(this.server).subscribe((projects: Project[]) => {
        const projectName = this.projectNameForm.controls['projectName'].value;
        let existingProject = projects.find(project => project.name === projectName);

        if (existingProject) {
          this.openConfirmationDialog(existingProject);
        } else {
          this.importProject();
        }
      });
    }
  }

  importProject() {
    const url = this.prepareUploadPath();
    this.uploader.queue.forEach(elem => (elem.url = url));

    this.isFirstStepCompleted = true;

    const itemToUpload = this.uploader.queue[0];
    this.uploader.uploadItem(itemToUpload);
  }

  openConfirmationDialog(existingProject: Project) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      height: '150px',
      data: {
        existingProject: existingProject
      }
    });

    dialogRef.afterClosed().subscribe((answer: boolean) => {
      if (answer) {
        this.projectService.close(this.server, existingProject.project_id).subscribe(() => {
          this.projectService.delete(this.server, existingProject.project_id).subscribe(() => {
            this.importProject();
          });
        });
      }
    });
  }

  onNoClick(): void {
    this.uploader.cancelAll();
    this.dialogRef.close();
  }

  onFinishClick(): void {
    this.dialogRef.close();
  }

  onDeleteClick(): void {
    this.uploader.queue.pop();
    this.isImportEnabled = false;
    this.isDeleteVisible = false;
    this.projectNameForm.controls['projectName'].setValue('');
  }

  prepareUploadPath(): string {
    const projectName = this.projectNameForm.controls['projectName'].value;
    return `http://${this.server.ip}:${this.server.port}/v2/projects/${uuid()}/import?name=${projectName}`;
  }
}
