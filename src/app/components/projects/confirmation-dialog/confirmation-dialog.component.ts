import { Component, Inject, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '@models/project';

@Component({
  standalone: true,
  selector: 'app-import-project-dialog',
  templateUrl: 'confirmation-dialog.component.html',
  styleUrls: ['confirmation-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmationDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  private existingProject: Project;
  public confirmationMessage: string;
  public isOpen: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
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
