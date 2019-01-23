import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ProjectService } from '../../../services/project.service';
import { v4 as uuid } from 'uuid';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-add-blank-project-dialog',
  templateUrl: './add-blank-project-dialog.component.html',
  styleUrls: ['./add-blank-project-dialog.component.css'],
  providers: [ProjectNameValidator]
})
export class AddBlankProjectDialogComponent implements OnInit {
  server: Server;
  projectNameForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddBlankProjectDialogComponent>,
    private router: Router,
    private dialog: MatDialog,
    private projectService: ProjectService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private projectNameValidator: ProjectNameValidator
  ) {
    this.projectNameForm = this.formBuilder.group({
      projectName: new FormControl(null, [Validators.required, projectNameValidator.get])
    });
  }

  ngOnInit() {}

  get form() {
    return this.projectNameForm.controls;
  }

  onAddClick(): void {
    if (this.projectNameForm.invalid) {
      return;
    }
    this.projectService.list(this.server).subscribe((projects: Project[]) => {
      const projectName = this.projectNameForm.controls['projectName'].value;
      let existingProject = projects.find(project => project.name === projectName);

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
    this.projectService
      .add(this.server, this.projectNameForm.controls['projectName'].value, uuid())
      .subscribe((project: Project) => {
        this.dialogRef.close();
        this.toasterService.success(`Project ${project.name} added`);
        this.router.navigate(['/server', this.server.id, 'project', project.project_id]);
      });
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
            this.addProject();
          });
        });
      }
    });
  }
}
