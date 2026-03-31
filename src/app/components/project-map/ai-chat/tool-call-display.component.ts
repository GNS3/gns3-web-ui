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
  templateUrl: './tool-call-display.component.html',
  styleUrls: ['./tool-call-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
