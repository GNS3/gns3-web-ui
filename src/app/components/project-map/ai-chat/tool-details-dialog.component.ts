import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MarkdownModule } from 'ngx-markdown';
import { ToolCall } from '@models/ai-chat.interface';

export interface ToolDetailsDialogData {
  type: 'tool_call' | 'tool_result';
  toolCall?: ToolCall;
  toolName?: string;
  toolOutput?: any;
}

/**
 * Tool Details Dialog Component
 * Displays tool call or tool result details in a Material Dialog
 */
@Component({
  selector: 'app-tool-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MarkdownModule
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
          <div class="content-container">
            <ng-container *ngIf="isArgumentsMarkdown">
              <markdown class="markdown-content" [data]="formattedArguments"></markdown>
            </ng-container>
            <pre *ngIf="!isArgumentsMarkdown" class="code-content"><code>{{ formattedArguments }}</code></pre>
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
          <div class="content-container">
            <ng-container *ngIf="isOutputMarkdown">
              <markdown class="markdown-content" [data]="formattedOutput"></markdown>
            </ng-container>
            <pre *ngIf="!isOutputMarkdown" class="code-content"><code>{{ formattedOutput }}</code></pre>
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
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      border-radius: 50%;
    }

    .close-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(244, 67, 54, 0.2);
      transform: translate(-50%, -50%);
      transition: width 0.4s ease, height 0.4s ease;
    }

    .close-button:hover {
      background-color: rgba(244, 67, 54, 0.1);
      box-shadow: 0 0 10px rgba(244, 67, 54, 0.4);
      transform: scale(1.1);
    }

    .close-button:hover::before {
      width: 100%;
      height: 100%;
    }

    .close-button:active {
      transform: scale(0.95);
    }

    .close-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      position: relative;
      z-index: 1;
    }

    .dialog-content {
      padding: 16px;
      max-width: 800px;
      min-width: 500px;
      max-height: 70vh;
      background-color: var(--mat-app-background);
      border-radius: 0 0 16px 16px;
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

    .content-container {
      background: var(--mat-app-surface-container-low);
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--mat-app-outline-variant);
    }

    .markdown-content {
      padding: 12px;
      color: var(--mat-app-on-surface);
      font-size: 14px;
      line-height: 1.5;
    }

    .markdown-content :global(p) {
      margin: 0.25em 0;
    }

    .markdown-content :global(ul),
    .markdown-content :global(ol) {
      margin: 0.25em 0;
    }

    .markdown-content :global(li) {
      margin: 0.1em 0;
    }

    .markdown-content :global(pre) {
      background: var(--mat-app-surface-container-high);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 4px 0;
      font-size: 13px;
    }

    .markdown-content :global(code) {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
    }

    .markdown-content :global(pre code) {
      font-size: 13px;
    }

    .code-content {
      margin: 0;
      padding: 12px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: var(--mat-app-on-surface);
      background: var(--mat-app-surface);
      overflow-x: auto;
      max-height: 500px;
      overflow-y: auto;
    }

    .code-content code {
      font-family: inherit;
      font-size: inherit;
    }

    /* Scrollbar styles - match AI chat window */
    .content-container::-webkit-scrollbar,
    .code-content::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .content-container::-webkit-scrollbar-track,
    .code-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .content-container::-webkit-scrollbar-thumb,
    .code-content::-webkit-scrollbar-thumb {
      background: rgba(0, 151, 167, 0.3);
      border-radius: 10px;
    }

    .content-container::-webkit-scrollbar-thumb:hover,
    .code-content::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 151, 167, 0.5);
    }

    /* Dark theme adjustments */
    :host-context(.dark-theme) .dialog-content {
      background-color: rgba(32, 49, 59, 0.95);
    }

    :host-context(.dark-theme) .markdown-content,
    :host-context(.dark-theme) .code-content {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .info-value {
      color: rgba(255, 255, 255, 0.87);
      background-color: rgba(26, 37, 44, 0.7);
    }

    :host-context(.dark-theme) .content-container {
      background-color: rgba(26, 37, 44, 0.7);
      border-color: var(--mat-app-outline-variant);
    }

    :host-context(.dark-theme) .code-content {
      background-color: rgba(32, 49, 59, 0.8);
    }

    /* Light theme adjustments */
    :host-context(.light-theme) .markdown-content,
    :host-context(.light-theme) .code-content {
      color: rgba(0, 0, 0, 0.87);
    }

    :host-context(.light-theme) .info-value {
      color: rgba(0, 0, 0, 0.87);
    }

    :host-context(.light-theme) .markdown-content :global(code) {
      background-color: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.95);
    }

    :host-context(.light-theme) .markdown-content :global(pre) {
      background-color: rgba(0, 0, 0, 0.05);
      color: rgba(0, 0, 0, 0.95);
    }

    :host-context(.light-theme) .markdown-content :global(pre code) {
      color: rgba(0, 0, 0, 0.95);
    }

    /* Dialog container styling - enhanced with glass effect */
    ::ng-deep .mat-mdc-dialog-container {
      border-radius: 16px !important;
      border: 1px solid var(--mat-app-outline-variant);
      backdrop-filter: blur(20px) saturate(180%) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 151, 167, 0.2) !important;
    }

    /* Dark theme dialog container */
    ::ng-deep .dark-theme .mat-mdc-dialog-container {
      background-color: rgba(32, 49, 59, 0.85) !important;
    }

    /* Light theme dialog container */
    ::ng-deep .light-theme .mat-mdc-dialog-container {
      background-color: rgba(255, 255, 255, 0.95) !important;
    }

    /* Enhanced GNS3 cyan gradient border effect */
    ::ng-deep .mat-mdc-dialog-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 16px;
      padding: 2px;
      background: linear-gradient(135deg, rgba(0, 151, 167, 0.6), rgba(0, 188, 212, 0.4), rgba(0, 151, 167, 0.6));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 1;
    }

    /* Enhance header with glass effect */
    .dialog-header {
      backdrop-filter: blur(10px);
      border-radius: 16px 16px 0 0;
    }

    /* Enhance content areas with rounded corners */
    .info-value {
      border-radius: 8px;
    }

    .content-container {
      border-radius: 8px;
    }

    .code-content {
      border-radius: 6px;
    }

    /* Enhanced close button with more rounded appearance */
    .close-button {
      border-radius: 50%;
    }

    /* Subtle glow effect on dark theme */
    :host-context(.dark-theme) ::ng-deep .mat-mdc-dialog-container {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 16px rgba(0, 151, 167, 0.3) !important;
    }

    /* Light theme shadow adjustment */
    :host-context(.light-theme) ::ng-deep .mat-mdc-dialog-container {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 151, 167, 0.15) !important;
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
          this.parsedOutput = this.toolOutput;
        }
      } else {
        this.parsedOutput = this.toolOutput;
      }
    }
  }

  get formattedArguments(): string {
    if (!this.parsedArguments) {
      return '// No arguments';
    }

    if (typeof this.parsedArguments === 'string') {
      return this.parsedArguments;
    }

    return JSON.stringify(this.parsedArguments, null, 2);
  }

  get formattedOutput(): string {
    if (!this.parsedOutput) {
      return '// No output';
    }

    if (typeof this.parsedOutput === 'string') {
      return this.parsedOutput;
    }

    return JSON.stringify(this.parsedOutput, null, 2);
  }

  get isArgumentsMarkdown(): boolean {
    // Check if arguments contain markdown-like content
    if (typeof this.parsedArguments === 'string') {
      const str = this.parsedArguments;
      // Check for common markdown patterns
      return str.includes('**') || str.includes('`') || str.includes('```') || str.includes('# ');
    }
    return false;
  }

  get isOutputMarkdown(): boolean {
    // Check if output contains markdown-like content
    if (typeof this.parsedOutput === 'string') {
      const str = this.parsedOutput;
      // Check for common markdown patterns
      return str.includes('**') || str.includes('`') || str.includes('```') || str.includes('# ');
    }
    return false;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
