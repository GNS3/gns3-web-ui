import { ChangeDetectionStrategy, Component, Output, EventEmitter, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToolCall } from '@models/ai-chat.interface';

/**
 * AI Chat Tool Call Display Component
 * Shows tool name with status indicator and progress
 */
@Component({
  selector: 'app-tool-call-display',
  imports: [MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toolCall()?.function?.name) {
    <div
      class="inline-tool-call"
      (click)="onViewDetails()"
      [title]="getStatusText()"
    >
      <mat-icon class="tool-icon">build</mat-icon>
      <span class="tool-name">{{ toolCall()?.function?.name }}</span>
      <span class="tool-status" [class.status-receiving]="isReceiving" [class.status-executing]="isExecuting()">
        @if (isReceiving || isExecuting()) {
        <mat-spinner diameter="12"></mat-spinner>
        } @else {
        <span class="status-text">{{ getStatusText() }}</span>
        }
      </span>
      <mat-icon class="expand-icon">open_in_new</mat-icon>
    </div>
    }
  `,
  styles: [
    `
      .inline-tool-call {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        margin: 8px 0;
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
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
        color: var(--mat-sys-on-surface);
      }

      .tool-status {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--mat-sys-on-surface-variant);
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
        color: var(--mat-sys-on-surface-variant);
        opacity: 0.5;
      }

      .inline-tool-call:hover .expand-icon {
        opacity: 1;
      }
    `,
  ],
})
export class ToolCallDisplayComponent {
  readonly toolCall = input<ToolCall & { isExecuting?: boolean }>(undefined);
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
    return this.toolCall()?.function?.complete === false;
  }

  /**
   * Get status text
   */
  getStatusText(): string {
    if (this.isReceiving) {
      return 'Receiving parameters...';
    }
    if (this.isExecuting() || (this.toolCall() as any)?.isExecuting) {
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
    const tc = this.toolCall();
    if (tc) {
      this.viewDetails.emit(tc);
    }
  }
}
