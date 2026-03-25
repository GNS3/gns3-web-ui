import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
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
 */
@Component({
  selector: 'app-tool-details-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    NgxJsonViewerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 mat-dialog-title>{{ title }}</h1>

    <div mat-dialog-content>
      @if (type() === 'tool_call' && toolCall()) {
        <div class="info-section">
          <div class="info-label">Function:</div>
          <div class="info-value">{{ toolCall().function.name }}</div>
        </div>

        <div class="info-section">
          <div class="info-label">Arguments:</div>
          <div class="json-container">
            <ngx-json-viewer [json]="parsedArguments()" [expanded]="true"></ngx-json-viewer>
          </div>
        </div>
      }

      @if (type() === 'tool_result') {
        <div class="info-section">
          <div class="info-label">Tool:</div>
          <div class="info-value">{{ toolName() }}</div>
        </div>

        <div class="info-section">
          <div class="info-label">Output:</div>
          <div class="json-container">
            <ngx-json-viewer [json]="parsedOutput()" [expanded]="false"></ngx-json-viewer>
          </div>
        </div>
      }
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="closeDialog()">Close</button>
    </div>
  `,
  styles: [`
    .info-section {
      margin-bottom: 16px;
    }

    .info-section:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      color: var(--mat-sys-on-surface);
      background: var(--mat-sys-surface-container-low);
      padding: 8px 12px;
      border-radius: 6px;
      word-break: break-all;
    }

    .json-container {
      background: var(--mat-sys-surface-container-low);
      border-radius: 6px;
      padding: 12px;
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid var(--mat-sys-outline-variant);
      white-space: pre-wrap;
      font-size: 13px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    }
  `
]
})
export class ToolDetailsDialogComponent {
  readonly type = signal<'tool_call' | 'tool_result'>('tool_call');
  readonly toolCall = signal<ToolCall | undefined>(undefined);
  readonly toolName = signal<string | undefined>(undefined);
  readonly toolOutput = signal<any>(undefined);

  readonly parsedArguments = signal<any>(null);
  readonly parsedOutput = signal<any>(null);

  constructor(
    private dialogRef: MatDialogRef<ToolDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ToolDetailsDialogData
  ) {
    this.type.set(data.type);
    this.toolCall.set(data.toolCall);
    this.toolName.set(data.toolName);
    this.toolOutput.set(data.toolOutput);

    this.parseJsonData();
  }

  get title(): string {
    return this.type() === 'tool_call' ? 'Tool Call Details' : 'Execution Result Details';
  }

  private parseJsonData(): void {
    const tc = this.toolCall();
    const output = this.toolOutput();

    if (tc?.function?.arguments) {
      try {
        const args = tc.function.arguments;
        if (typeof args === 'string') {
          this.parsedArguments.set(JSON.parse(args));
        } else if (args.tool_input && typeof args.tool_input === 'string') {
          this.parsedArguments.set(JSON.parse(args.tool_input));
        } else {
          this.parsedArguments.set(args);
        }
      } catch (e) {
        this.parsedArguments.set(tc.function.arguments);
      }
    }

    if (output) {
      if (typeof output === 'string') {
        try {
          this.parsedOutput.set(JSON.parse(output));
        } catch (e) {
          this.parsedOutput.set(output);
        }
      } else {
        this.parsedOutput.set(output);
      }
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
