import { Component, Inject, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  standalone: true,
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule],
})
export class ProgressDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ProgressDialogComponent>);

  public static CANCELLED: 'canceled';

  public value: 50;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onCancelClick(): void {
    this.dialogRef.close(ProgressDialogComponent.CANCELLED);
  }

  ngOnInit() {}
}
