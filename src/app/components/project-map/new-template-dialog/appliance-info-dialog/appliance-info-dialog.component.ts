import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Appliance } from '@models/appliance';

@Component({
  selector: 'app-appliance-info-dialog',
  templateUrl: 'appliance-info-dialog.component.html',
  styleUrls: ['appliance-info-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplianceInfoDialogComponent {
  public dialogRef = inject(MatDialogRef<ApplianceInfoDialogComponent>);
  public appliance: Appliance;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.appliance = data?.appliance;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
