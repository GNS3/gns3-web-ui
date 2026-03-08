import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ToolCall } from '@models/ai-chat.interface';

/**
 * AI Chat Tool Call Display Component
 * Simplified display - shows tool name as clickable inline element
 */
@Component({
  selector: 'app-tool-call-display',
  template: `
    <div class="inline-tool-call" (click)="onViewDetails()" title="Click to view details">
      <mat-icon class="tool-icon">build</mat-icon>
      <span class="tool-name">{{ toolCall.function.name }}</span>
      <mat-icon class="expand-icon">open_in_new</mat-icon>
    </div>
  `,
  styles: [`
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
  `]
})
export class ToolCallDisplayComponent {
  @Input() toolCall: ToolCall;
  @Input() toolOutput?: string;
  @Input() error?: string;
  @Input() isExecuting = false;
  @Output() viewDetails = new EventEmitter<ToolCall>();

  /**
   * Emit viewDetails event to open dialog
   */
  onViewDetails(): void {
    if (this.toolCall) {
      this.viewDetails.emit(this.toolCall);
    }
  }
}
