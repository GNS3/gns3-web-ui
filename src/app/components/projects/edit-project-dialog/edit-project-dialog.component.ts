import { Component, OnInit, Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';
import { ToasterService } from '../../../services/toaster.service';
import { NonNegativeValidator } from '../../../validators/non-negative-validator';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-edit-project-dialog',
  templateUrl: './edit-project-dialog.component.html',
  styleUrls: ['./edit-project-dialog.component.scss']
})
export class EditProjectDialogComponent implements OnInit {
  server: Server;
  project: Project;
  formGroup: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditProjectDialogComponent>,
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private toasterService: ToasterService,
    private nonNegativeValidator: NonNegativeValidator
  ) {
    this.formGroup = this.formBuilder.group({
      projectName: new FormControl('', [Validators.required]),
      width: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      height: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      nodeGridSize: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      drawingGridSize: new FormControl('', [Validators.required, nonNegativeValidator.get])
    });
  }

  ngOnInit() {
    this.formGroup.controls['projectName'].setValue(this.project.name);
    this.formGroup.controls['width'].setValue(this.project.scene_width);
    this.formGroup.controls['height'].setValue(this.project.scene_height);
    this.formGroup.controls['nodeGridSize'].setValue(this.project.grid_size);
    this.formGroup.controls['drawingGridSize'].setValue(this.project.drawing_grid_size);
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

        this.projectService.update(this.server, this.project).subscribe((project: Project) => {
            this.toasterService.success(`Project ${project.name} updated.`);
            this.onNoClick();
        })
    } else {
        this.toasterService.error(`Fill all required fields with correct values.`);
    }
  }
}
