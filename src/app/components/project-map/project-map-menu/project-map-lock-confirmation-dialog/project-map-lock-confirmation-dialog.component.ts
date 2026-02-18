import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-project-map-lock-confirmation-dialog',
  templateUrl: './project-map-lock-confirmation-dialog.component.html',
  styleUrls: ['./project-map-lock-confirmation-dialog.component.scss']
})
export class ProjectMapLockConfirmationDialogComponent implements OnInit {
  confirmActionData = {
    actionType: 'Unlock',
    isAction:false
  };  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ProjectMapLockConfirmationDialogComponent>
  ) {}

  ngOnInit(): void {
    this.confirmActionData.actionType = this.data.actionType;
  }

  confirmAction() {
    this.confirmActionData.isAction = this.data.actionType == 'Lock'? true : false;
    this.dialogRef.close(this.confirmActionData);
  }

}
