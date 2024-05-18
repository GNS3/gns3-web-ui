import { Component, OnInit, Injectable, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project, ProjectVariable } from '../../../models/project';
import { Controller } from '../../../models/controller';
import { ProjectService } from '../../../services/project.service';
import { ToasterService } from '../../../services/toaster.service';
import { NonNegativeValidator } from '../../../validators/non-negative-validator';
import { ReadmeEditorComponent } from './readme-editor/readme-editor.component';

@Component({
  selector: 'app-edit-project-dialog',
  templateUrl: './edit-project-dialog.component.html',
  styleUrls: ['./edit-project-dialog.component.scss'],
})
export class EditProjectDialogComponent implements OnInit {
  @ViewChild('editor') editor: ReadmeEditorComponent;

  controller:Controller ;
  project: Project;
  formGroup: UntypedFormGroup;
  variableFormGroup: UntypedFormGroup;
  projectVariables: ProjectVariable[];

  displayedColumns: string[] = ['name', 'value', 'actions'];
  variables: ProjectVariable[] = [];

  auto_close: boolean;

  constructor(
    public dialogRef: MatDialogRef<EditProjectDialogComponent>,
    private formBuilder: UntypedFormBuilder,
    private projectService: ProjectService,
    private toasterService: ToasterService,
    private nonNegativeValidator: NonNegativeValidator
  ) {
    this.formGroup = this.formBuilder.group({
      projectName: new UntypedFormControl('', [Validators.required]),
      width: new UntypedFormControl('', [Validators.required, nonNegativeValidator.get]),
      height: new UntypedFormControl('', [Validators.required, nonNegativeValidator.get]),
      nodeGridSize: new UntypedFormControl('', [Validators.required, nonNegativeValidator.get]),
      drawingGridSize: new UntypedFormControl('', [Validators.required, nonNegativeValidator.get]),
    });

    this.variableFormGroup = this.formBuilder.group({
      name: new UntypedFormControl('', [Validators.required]),
      value: new UntypedFormControl('', [Validators.required]),
    });
  }

  ngOnInit() {
    this.formGroup.controls['projectName'].setValue(this.project.name);
    this.formGroup.controls['width'].setValue(this.project.scene_width);
    this.formGroup.controls['height'].setValue(this.project.scene_height);
    this.formGroup.controls['nodeGridSize'].setValue(this.project.grid_size);
    this.formGroup.controls['drawingGridSize'].setValue(this.project.drawing_grid_size);
    if (this.project.variables) {
      this.project.variables.forEach((n) => this.variables.push(n));
    }
    this.auto_close = !this.project.auto_close;
  }

  addVariable() {
    if (this.variableFormGroup.valid) {
      let variable: ProjectVariable = {
        name: this.variableFormGroup.get('name').value,
        value: this.variableFormGroup.get('value').value,
      };
      this.variables = this.variables.concat([variable]);
    } else {
      this.toasterService.error(`Fill all required fields with correct values.`);
    }
  }

  deleteVariable(variable: ProjectVariable) {
    this.variables = this.variables.filter((elem) => elem !== variable);
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onYesClick() {
    if (this.formGroup.valid) {
      this.project.name = this.formGroup.get('projectName').value;
      this.project.scene_width = this.formGroup.get('width').value;
      this.project.scene_height = this.formGroup.get('height').value;
      this.project.drawing_grid_size = this.formGroup.get('drawingGridSize').value;
      this.project.grid_size = this.formGroup.get('nodeGridSize').value;
      this.project.variables = this.variables;

      this.project.auto_close = !this.auto_close;

      this.projectService.update(this.controller, this.project).subscribe((project: Project) => {
        this.projectService.postReadmeFile(this.controller, this.project.project_id, this.editor.markdown).subscribe((response) => {
          this.toasterService.success(`Project ${project.name} updated.`);
          this.onNoClick();
        });
      })
    } else {
      this.toasterService.error(`Fill all required fields with correct values.`);
    }
  }
}
