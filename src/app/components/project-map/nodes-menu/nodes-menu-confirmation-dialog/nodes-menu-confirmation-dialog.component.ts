import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-nodes-menu-confirmation-dialog',
  templateUrl: './nodes-menu-confirmation-dialog.component.html',
  styleUrls: ['./nodes-menu-confirmation-dialog.component.scss'],
})
export class NodesMenuConfirmationDialogComponent implements OnInit {
  confirmActionData = {
    actionType: 'start',
    isAction:false
  };
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<NodesMenuConfirmationDialogComponent>
  ) {}

  ngOnInit(): void {
    this.confirmActionData.actionType = this.data;
  }

  confirmAction() {
    this.confirmActionData.isAction = true
    this.dialogRef.close(this.confirmActionData);
  }
}
