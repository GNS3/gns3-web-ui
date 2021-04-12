import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Appliance } from '../../../../models/appliance';

@Component({
  selector: 'appliance-info-dialog',
  templateUrl: 'appliance-info-dialog.component.html',
})
export class ApplianceInfoDialogComponent {
  public appliance: Appliance;

  constructor(
    public dialogRef: MatDialogRef<ApplianceInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
