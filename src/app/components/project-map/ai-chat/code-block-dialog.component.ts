import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Code Block Dialog Data Interface
 */
export interface CodeBlockDialogData {
  /** The HTML content of the code block */
  code: string;
  /** Programming language (optional) */
  language?: string;
}

/**
 * Code Block Dialog Component
 * Displays long code blocks in a full-size dialog for better readability
 */
@Component({
  selector: 'app-code-block-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="code-block-dialog__title">
      <mat-icon class="code-block-dialog__icon">code</mat-icon>
      <span class="code-block-dialog__title-text">Code Block</span>
      @if (data.language) {
      <span class="code-block-dialog__language">{{ data.language }}</span>
      }
    </h2>

    <mat-dialog-content class="code-block-dialog__content">
      <pre class="code-block-dialog__code"><code [innerHTML]="data.code"></code></pre>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()" class="code-block-dialog__close-btn">
        <mat-icon>close</mat-icon>
        <span>Close</span>
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./code-block-dialog.component.scss'],
})
export class CodeBlockDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<CodeBlockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CodeBlockDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
