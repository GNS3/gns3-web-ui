import { Component, Inject, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Options accepted by ProgressDialogService.open(). */
export interface ProgressDialogOptions {
  /** Dialog heading, e.g. "Creating snapshot". */
  title?: string;
  /** Line describing the running operation, e.g. "Creating snapshot 'base'…". */
  message?: string;
  /**
   * Hint shown under the message when the operation cannot be cancelled once
   * started (the server keeps running it no matter what the client does).
   * Closing the dialog only hides it; the result still arrives via toaster.
   */
  backgroundHint?: string;
}

@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrl: './progress-dialog.component.scss',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressDialogComponent {
  public dialogRef = inject(MatDialogRef<ProgressDialogComponent>);

  public title: string;
  public message: string;
  public backgroundHint: string;

  constructor(@Inject(MAT_DIALOG_DATA) data: ProgressDialogOptions = {}) {
    this.title = data.title || 'Please wait';
    this.message = data.message || 'The operation is in progress…';
    this.backgroundHint = data.backgroundHint || '';
  }

  onDismissClick(): void {
    this.dialogRef.close();
  }
}
