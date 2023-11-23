import { Component, EventEmitter, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Project } from '../../../models/project';
import{ Controller } from '../../../models/controller';
import { ProjectService } from '../../../services/project.service';
import { ToasterService } from '../../../services/toaster.service';
import { projectNameAsyncValidator } from '../../../validators/project-name-async-validator';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ProjectNameValidator } from '../models/projectNameValidator';

@Component({
  selector: 'app-add-blank-project-dialog',
  templateUrl: './add-blank-project-dialog.component.html',
  styleUrls: ['./add-blank-project-dialog.component.scss'],
  providers: [ProjectNameValidator],
})
export class AddBlankProjectDialogComponent implements OnInit {
  controller:Controller ;
  projectNameForm: UntypedFormGroup;
  uuid: string;
  onAddProject = new EventEmitter<string>();

  constructor(
    public dialogRef: MatDialogRef<AddBlankProjectDialogComponent>,
    private router: Router,
    private dialog: MatDialog,
    private projectService: ProjectService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private projectNameValidator: ProjectNameValidator
  ) {}

  ngOnInit() {
    this.projectNameForm = this.formBuilder.group({
      projectName: new UntypedFormControl(
        null,
        [Validators.required, this.projectNameValidator.get],
        [projectNameAsyncValidator(this.controller, this.projectService)]
      ),
    });
  }

  get form() {
    return this.projectNameForm.controls;
  }

  onAddClick(): void {
    if (this.projectNameForm.invalid) {
      return;
    }
    this.projectService.list(this.controller).subscribe((projects: Project[]) => {
      const projectName = this.projectNameForm.controls['projectName'].value;
      let existingProject = projects.find((project) => project.name === projectName);

      if (existingProject) {
        this.openConfirmationDialog(existingProject);
      } else {
        this.addProject();
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addProject(): void {
    this.uuid = uuid();
    this.projectService
      .add(this.controller, this.projectNameForm.controls['projectName'].value, this.uuid)
      .subscribe((project: Project) => {
        this.dialogRef.close();
        this.toasterService.success(`Project ${project.name} added`);
        this.router.navigate(['/controller', this.controller.id, 'project', project.project_id]);
      },
      (error) => {
          this.toasterService.error("Cannot create new project");
          console.log(error);
      }
    );
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }

  openConfirmationDialog(existingProject: Project) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      height: '150px',
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
            this.addProject();
          });
        });
      }
    });
  }
}
