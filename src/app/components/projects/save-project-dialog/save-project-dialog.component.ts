import { Component, OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ProjectService } from '../../../services/project.service';
import { v4 as uuid } from 'uuid';
import { ProjectNameValidator } from '../models/projectNameValidator';
import { ToasterService } from '../../../services/toaster.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';


@Component({
  selector: 'app-save-project-dialog',
  templateUrl: './save-project-dialog.component.html',
  styleUrls: ['./save-project-dialog.component.css'],
  providers: [ProjectNameValidator]
})
export class SaveProjectDialogComponent implements OnInit {
  server: Server;
  project: Project;
  projectNameForm: FormGroup;
  onAddProject = new EventEmitter<string>();

  constructor(
    public dialogRef: MatDialogRef<SaveProjectDialogComponent>,
    private projectService: ProjectService,
    private nodesDataSource: NodesDataSource,
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
        this.toasterService.error(`Project with this name already exists.`);
      } else if (this.nodesDataSource.getItems().filter(node => 
        (node.status === 'started' && node.node_type==='vpcs') || 
        (node.status === 'started' && node.node_type==='virtualbox') || 
        (node.status === 'started' && node.node_type==='vmware')).length > 0) {
        this.toasterService.error('Please stop all nodes in order to save project.')
      } else {
        this.addProject();
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addProject(): void {
    this.projectService.duplicate(this.server, this.project.project_id, this.projectNameForm.controls['projectName'].value).subscribe((project: Project) => {
        this.dialogRef.close();
        this.toasterService.success(`Project ${project.name} added`);
    });
  }

  onKeyDown(event) {
    if (event.key === "Enter") {
      this.onAddClick();
    }
  }
}
