import { Component, Input, Output, EventEmitter, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToolCall } from '@models/ai-chat.interface';

/**
 * AI Chat Tool Call Display Component
 * Shows tool name with status indicator and progress
 */
@Component({
  selector: 'app-tool-call-display',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="inline-tool-call" (click)="onViewDetails()" [title]="getStatusText()" *ngIf="toolCall?.function?.name">
      <mat-icon class="tool-icon">build</mat-icon>
      <span class="tool-name">{{ toolCall?.function?.name }}</span>
      <span class="tool-status" [class.status-receiving]="isReceiving" [class.status-executing]="isExecuting()">
        <mat-spinner *ngIf="isReceiving || isExecuting()" diameter="12"></mat-spinner>
        <span *ngIf="!isReceiving && !isExecuting()" class="status-text">{{ getStatusText() }}</span>
      </span>
      <mat-icon class="expand-icon">open_in_new</mat-icon>
    </div>
  `,
  styles: [
    `
      .inline-tool-call {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        margin: 8px 0;
        background: var(--mat-app-surface-container-low);
        border: 1px solid var(--mat-app-outline-variant);
        border-left: 3px solid #0ea5e9;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        font-size: 13px;
      }

      .inline-tool-call:hover {
        background: rgba(14, 165, 233, 0.08);
        border-color: #0ea5e9;
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(14, 165, 233, 0.15);
      }

      .tool-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
        color: #0ea5e9;
      }

      .tool-name {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
        font-weight: 500;
        color: var(--mat-app-on-surface);
      }

      .tool-status {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--mat-app-on-surface-variant);
      }

      .tool-status.status-receiving {
        color: #f59e0b;
      }

      .tool-status.status-executing {
        color: #8b5cf6;
      }

      .status-text {
        font-size: 11px;
      }

      .expand-icon {
        width: 14px;
        height: 14px;
        font-size: 14px;
        color: var(--mat-app-on-surface-variant);
        opacity: 0.5;
      }

      .inline-tool-call:hover .expand-icon {
        opacity: 1;
      }

      ::ng-deep .tool-status mat-spinner {
        display: inline-block;
      }
    `,
  ],
})
export class ToolCallDisplayComponent {
  @Input() toolCall: ToolCall & { isExecuting?: boolean };
  readonly toolOutput = input<string>(undefined);
  readonly error = input<string>(undefined);
  readonly isExecuting = input(false);

  // For historical messages, the tool call is already complete
  readonly isHistory = input(false);
  @Output() viewDetails = new EventEmitter<ToolCall>();

  /**
   * Check if receiving tool call parameters (not complete)
   * Only show for real-time messages when complete is explicitly false
   */
  get isReceiving(): boolean {
    // For history messages, complete might not exist - treat as complete
    // Only show receiving when complete is explicitly false (real-time)
    return this.toolCall?.function?.complete === false;
  }

  /**
   * Get status text
   */
  getStatusText(): string {
    if (this.isReceiving) {
      return 'Receiving parameters...';
    }
    if (this.isExecuting() || (this.toolCall as any)?.isExecuting) {
      return 'Executing...';
    }
    if (this.error()) {
      return 'Error';
    }
    if (this.toolOutput()) {
      return 'Completed';
    }
    // For history messages, always show as ready/completed
    return 'Completed';
  }

  /**
   * Emit viewDetails event to open dialog
   */
  onViewDetails(): void {
    if (this.toolCall) {
      this.viewDetails.emit(this.toolCall);
    }
  }
}
