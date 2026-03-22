import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Appliance } from '@models/appliance';

@Component({
  selector: 'appliance-info-dialog',
  templateUrl: 'appliance-info-dialog.component.html',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplianceInfoDialogComponent {
  public dialogRef = inject(MatDialogRef<ApplianceInfoDialogComponent>);
  public appliance: Appliance;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
