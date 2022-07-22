import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../../models/project';
import{ Controller } from '../../../models/controller';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-choose-name-dialog',
  templateUrl: './choose-name-dialog.component.html',
  styleUrls: ['./choose-name-dialog.component.scss'],
})
export class ChooseNameDialogComponent implements OnInit {
  @Input() controller:Controller ;
  @Input() project: Project;
  name: string;

  constructor(public dialogRef: MatDialogRef<ChooseNameDialogComponent>, private projectService: ProjectService) {}

  ngOnInit() {
    this.name = this.project.name;
  }

  onCloseClick() {
    this.dialogRef.close();
  }

  onSaveClick() {
    this.projectService.duplicate(this.controller, this.project.project_id, this.name).subscribe(() => {
      this.dialogRef.close();
    });
  }
}
