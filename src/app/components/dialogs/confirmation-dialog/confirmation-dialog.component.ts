import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
  details?: readonly string[];
  note?: string;
  tone?: 'danger' | 'warning' | 'neutral';
  icon?: string;
  hideConfirm?: boolean;
}

/**
 * Confirmation Dialog Component
 * Reusable centered confirmation dialog for destructive and high-impact actions.
 */
@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  /**
   * Get dialog title.
   */
  get title(): string {
    return this.data.title || 'Confirm action';
  }

  /**
   * Get confirm button text.
   */
  get confirmButtonText(): string {
    return this.data.confirmButtonText || 'Confirm';
  }

  /**
   * Get cancel button text.
   */
  get cancelButtonText(): string {
    return this.data.cancelButtonText || 'Cancel';
  }

  get tone(): 'danger' | 'warning' | 'neutral' {
    return this.data.tone || 'danger';
  }

  get icon(): string {
    if (this.data.icon) {
      return this.data.icon;
    }
    return this.tone === 'danger' ? 'delete_forever' : this.tone === 'warning' ? 'warning' : 'help';
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
