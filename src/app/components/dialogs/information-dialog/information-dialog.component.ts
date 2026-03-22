import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-information-dialog',
  templateUrl: 'information-dialog.component.html',
  styleUrl: 'information-dialog.component.scss',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
