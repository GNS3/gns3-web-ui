import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToolCall } from '@models/ai-chat.interface';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

export interface ToolDetailsDialogData {
  type: 'tool_call' | 'tool_result';
  toolCall?: ToolCall;
  toolName?: string;
  toolOutput?: any;
}

/**
 * Tool Details Dialog Component
 * Displays tool call or tool result details in a Material Dialog
 * Uses JsonViewerComponent for formatted JSON display
 */
@Component({
  selector: 'app-tool-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    NgxJsonViewerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="title-icon">{{ type === 'tool_call' ? 'build' : 'check_circle' }}</mat-icon>
        <span>{{ title }}</span>
      </h2>
      <button mat-icon-button class="close-button" (click)="closeDialog()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div mat-dialog-content class="dialog-content">
      <!-- Tool Call Content -->
      <ng-container *ngIf="type === 'tool_call' && toolCall">
        <div class="info-section">
          <div class="info-label">Function:</div>
          <div class="info-value">{{ toolCall.function.name }}</div>
        </div>

        <div class="info-section">
          <div class="info-label">Arguments:</div>
          <div class="json-container">
            <ngx-json-viewer [json]="parsedArguments" [expanded]="true"></ngx-json-viewer>
          </div>
        </div>
      </ng-container>

      <!-- Tool Result Content -->
      <ng-container *ngIf="type === 'tool_result'">
        <div class="info-section">
          <div class="info-label">Tool:</div>
          <div class="info-value">{{ toolName }}</div>
        </div>

        <div class="info-section">
          <div class="info-label">Output:</div>
          <div class="json-container">
            <ngx-json-viewer [json]="parsedOutput" [expanded]="false"></ngx-json-viewer>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--mat-app-outline-variant);
      margin: -24px -24px 0 -24px;
      background: linear-gradient(to bottom, var(--mat-app-surface), var(--mat-app-surface-container-low));
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
    }

    .title-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-app-primary);
    }

    .close-button {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      padding: 0;
      color: var(--mat-app-on-surface);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .close-button:hover {
      background-color: rgba(244, 67, 54, 0.1);
      border-radius: 50%;
    }

    .close-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .dialog-content {
      padding: 16px;
      max-width: 800px;
      min-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
      background-color: var(--mat-app-background);
    }

    .info-section {
      margin-bottom: 16px;
    }

    .info-section:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      color: var(--mat-app-on-surface);
      background: var(--mat-app-surface-container-low);
      padding: 8px 12px;
      border-radius: 6px;
      word-break: break-all;
    }

    .json-container {
      background: var(--mat-app-surface-container-low);
      border-radius: 6px;
      padding: 12px;
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid var(--mat-app-outline-variant);
      white-space: pre-wrap;
      font-size: 13px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    }

    /* ngx-json-viewer theme colors - scoped to this dialog using panelClass */
    ::ng-deep .tool-details-dialog.dark-theme .json-container {
      --ngx-json-string: #a5d6ff;
      --ngx-json-number: #79c0ff;
      --ngx-json-boolean: #ff7b72;
      --ngx-json-date: #d29922;
      --ngx-json-array: #ffa657;
      --ngx-json-object: #7ee787;
      --ngx-json-function: #fff;
      --ngx-json-null: #8b949e;
      --ngx-json-null-bg: rgba(235, 235, 235, 0.1);
      --ngx-json-undefined: #f28179;
      --ngx-json-key: #7ee787;
      --ngx-json-separator: #8b949e;
      --ngx-json-value: var(--mat-app-on-surface);
    }

    /* Light mode colors - scoped */
    ::ng-deep .tool-details-dialog.light-theme .json-container {
      --ngx-json-string: #0451a5;
      --ngx-json-number: #098658;
      --ngx-json-boolean: #0000ff;
      --ngx-json-date: #795e26;
      --ngx-json-array: #a31515;
      --ngx-json-object: #098658;
      --ngx-json-function: #795e26;
      --ngx-json-null: #808080;
      --ngx-json-null-bg: rgba(0, 0, 0, 0.04);
      --ngx-json-undefined: #a31515;
      --ngx-json-key: #0451a5;
      --ngx-json-separator: #808080;
      --ngx-json-value: var(--mat-app-on-surface);
    }

    /* Scrollbar styles */
    .dialog-content::-webkit-scrollbar,
    .json-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .dialog-content::-webkit-scrollbar-track,
    .json-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-content::-webkit-scrollbar-thumb,
    .json-container::-webkit-scrollbar-thumb {
      background: rgba(0, 151, 167, 0.3);
      border-radius: 10px;
    }

    .dialog-content::-webkit-scrollbar-thumb:hover,
    .json-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 151, 167, 0.5);
    }

    /* Dialog container styling with glassmorphism effect - scoped using panelClass */
    ::ng-deep .tool-details-dialog .mat-dialog-container {
      border-radius: 16px !important;
      border: 1px solid var(--mat-app-outline-variant);
      backdrop-filter: blur(16px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 151, 167, 0.15) !important;
    }

    /* Make dialog surface transparent for glassmorphism - scoped */
    ::ng-deep .tool-details-dialog .mat-dialog-container .mat-dialog-surface {
      background-color: transparent !important;
    }

    /* Dark theme glassmorphism - scoped */
    ::ng-deep .tool-details-dialog.dark-theme .mat-dialog-container {
      background-color: rgba(30, 41, 55, 0.75) !important;
    }

    /* Light theme glassmorphism - scoped */
    ::ng-deep .tool-details-dialog.light-theme .mat-dialog-container {
      background-color: rgba(255, 255, 255, 0.85) !important;
    }
  `]
})
export class ToolDetailsDialogComponent {
  type: 'tool_call' | 'tool_result' = 'tool_call';
  toolCall?: ToolCall;
  toolName?: string;
  toolOutput?: any;

  parsedArguments: any = null;
  parsedOutput: any = null;

  constructor(
    public dialogRef: MatDialogRef<ToolDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ToolDetailsDialogData
  ) {
    this.type = data.type;
    this.toolCall = data.toolCall;
    this.toolName = data.toolName;
    this.toolOutput = data.toolOutput;

    this.parseJsonData();
  }

  get title(): string {
    return this.type === 'tool_call' ? 'Tool Call Details' : 'Execution Result Details';
  }

  private parseJsonData(): void {
    // Parse tool call arguments
    if (this.toolCall?.function?.arguments) {
      try {
        const args = this.toolCall.function.arguments;

        // Handle both string and object formats
        if (typeof args === 'string') {
          // String format - parse it
          this.parsedArguments = JSON.parse(args);
        } else if (args.tool_input && typeof args.tool_input === 'string') {
          // Object format with tool_input wrapper - parse the inner string
          this.parsedArguments = JSON.parse(args.tool_input);
        } else {
          // Object format without wrapper - use as-is
          this.parsedArguments = args;
        }
      } catch (e) {
        // If all parsing fails, keep the original value
        this.parsedArguments = this.toolCall.function.arguments;
      }
    }

    // Parse tool output
    if (this.toolOutput) {
      if (typeof this.toolOutput === 'string') {
        try {
          this.parsedOutput = JSON.parse(this.toolOutput);
        } catch (e) {
          // Not valid JSON, keep as string
          this.parsedOutput = this.toolOutput;
        }
      } else {
        this.parsedOutput = this.toolOutput;
      }
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
