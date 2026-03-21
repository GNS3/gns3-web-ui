import { Component, Inject, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  standalone: true,
  selector: 'app-project-map-lock-confirmation-dialog',
  templateUrl: './project-map-lock-confirmation-dialog.component.html',
  styleUrls: ['./project-map-lock-confirmation-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatDividerModule],
})
export class ProjectMapLockConfirmationDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ProjectMapLockConfirmationDialogComponent>);

  confirmActionData = {
    actionType: 'Unlock',
    isAction:false
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.confirmActionData.actionType = this.data.actionType;
  }

  confirmAction() {
    this.confirmActionData.isAction = this.data.actionType == 'Lock'? true : false;
    this.dialogRef.close(this.confirmActionData);
  }

}
