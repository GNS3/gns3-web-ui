import { Component, Inject, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrl: './progress-dialog.component.scss',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressDialogComponent {
  public dialogRef = inject(MatDialogRef<ProgressDialogComponent>);

  public static CANCELLED: 'canceled';

  public value = signal<number>(50);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onCancelClick(): void {
    this.dialogRef.close(ProgressDialogComponent.CANCELLED);
  }
}
