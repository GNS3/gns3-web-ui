import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Project } from '../../../models/project';

@Component({
  selector: 'app-import-project-dialog',
  templateUrl: 'confirmation-dialog.component.html',
  styleUrls: ['confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit {
  private existingProject: Project;
  public confirmationMessage: string;
  public isOpen: boolean;
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.existingProject = data['existingProject'];
  }

  ngOnInit() {
    if (this.existingProject.status === 'opened') {
      this.confirmationMessage = `Project ${this.existingProject.name} is open. You can not overwrite it.`;
      this.isOpen = true;
    } else {
      this.confirmationMessage = `Project ${this.existingProject.name} already exist, overwrite it?`;
    }
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
