import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Confirmation Dialog Data Interface
 */
export interface ConfirmationDialogData {
  message: string;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

/**
 * Confirmation Dialog Component
 * Reusable confirmation dialog for delete/confirm actions
 * Can be positioned near the click location for better UX
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  imports: [CommonModule, MatIconModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  /**
   * Get dialog title (defaults to "Confirm Delete")
   */
  get title(): string {
    return this.data.title || 'Confirm Delete';
  }

  /**
   * Get confirm button text (defaults to "Yes")
   */
  get confirmButtonText(): string {
    return this.data.confirmButtonText || 'Yes';
  }

  /**
   * Get cancel button text (defaults to "No")
   */
  get cancelButtonText(): string {
    return this.data.cancelButtonText || 'No';
  }

  /**
   * Handle cancel button click
   */
  onNoClick(): void {
    this.dialogRef.close(false);
  }

  /**
   * Handle confirm button click
   */
  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
