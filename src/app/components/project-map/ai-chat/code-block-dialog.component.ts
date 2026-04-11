import { ChangeDetectionStrategy, Component, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

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
export class CodeBlockDialogComponent implements AfterViewInit {
  constructor(
    private dialogRef: MatDialogRef<CodeBlockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CodeBlockDialogData
  ) {}

  ngAfterViewInit(): void {
    // Apply Prism syntax highlighting after view init
    if (typeof window !== 'undefined' && (window as any).Prism) {
      (window as any).Prism.highlightAll();
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
