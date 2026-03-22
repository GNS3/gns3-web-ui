import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-information-dialog',
  templateUrl: 'information-dialog.component.html',
  styleUrls: ['information-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class InformationDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<InformationDialogComponent>);
  public confirmationMessage: string;

  ngOnInit() {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
