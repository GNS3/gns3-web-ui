import { Component, EventEmitter, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { ProjectNameValidator } from '../models/projectNameValidator';

@Component({
  selector: 'app-save-project-dialog',
  templateUrl: './save-project-dialog.component.html',
  styleUrls: ['./save-project-dialog.component.scss'],
  providers: [ProjectNameValidator],
})
export class SaveProjectDialogComponent implements OnInit {
  controller: Controller;
  project: Project;
  projectNameForm: UntypedFormGroup;
  onAddProject = new EventEmitter<string>();

  constructor(
    public dialogRef: MatDialogRef<SaveProjectDialogComponent>,
    private projectService: ProjectService,
    private nodesDataSource: NodesDataSource,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private projectNameValidator: ProjectNameValidator
  ) {
    this.projectNameForm = this.formBuilder.group({
      projectName: new UntypedFormControl(null, [Validators.required, projectNameValidator.get]),
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
    this.projectService.list(this.controller).subscribe((projects: Project[]) => {
      const projectName = this.projectNameForm.controls['projectName'].value;
      let existingProject = projects.find((project) => project.name === projectName);

      if (existingProject) {
        this.toasterService.error(`Project with this name already exists.`);
      } else if (
        this.nodesDataSource
          .getItems()
          .filter(
            (node) =>
              (node.status === 'started' && node.node_type === 'vpcs') ||
              (node.status === 'started' && node.node_type === 'virtualbox') ||
              (node.status === 'started' && node.node_type === 'vmware')
          ).length > 0
      ) {
        this.toasterService.error('Please stop all nodes in order to save project.');
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
      .duplicate(this.controller, this.project.project_id, this.projectNameForm.controls['projectName'].value)
      .subscribe((project: Project) => {
        this.dialogRef.close();
        this.toasterService.success(`Project ${project.name} added`);
      });
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }
}
