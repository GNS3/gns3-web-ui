import {
  Component,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewChecked,
  ElementRef,
  ChangeDetectionStrategy,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MarkdownModule } from 'ngx-markdown';
import { ChatMessage, ToolCall, ToolResult } from '@models/ai-chat.interface';
import { ToolCallDisplayComponent } from './tool-call-display.component';
import { ToolDetailsDialogComponent, ToolDetailsDialogData } from './tool-details-dialog.component';

/**
 * AI Chat Message List Component
 * Displays chat message history with enhanced message types
 * Supports: user, assistant, system, tool_call, tool_result messages
 */
@Component({
  selector: 'app-chat-message-list',
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, MarkdownModule],
  templateUrl: './chat-message-list.component.html',
  styleUrls: ['./chat-message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageListComponent implements OnChanges, AfterViewChecked {
  readonly messages = input<ChatMessage[]>([]);
  readonly isStreaming = input(false);
  readonly autoScroll = input(true);

  @Output() scrollToEnd = new EventEmitter<void>();
  @Output() suggestionClicked = new EventEmitter<string>();

  private readonly messageContainer = viewChild.required<ElementRef<HTMLDivElement>>('messageContainer');

  private shouldScrollToBottom = false;

  private dialog = inject(MatDialog);

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    // Mark need to scroll to bottom when messages change
    if (changes['messages'] && changes['messages'].previousValue !== changes['messages'].currentValue) {
      this.shouldScrollToBottom = true;
    }
  }

  ngAfterViewChecked(): void {
    // Scroll to bottom if needed and auto-scroll is enabled
    if (this.shouldScrollToBottom && this.autoScroll()) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }

    // Add copy buttons to code blocks
    this.addCopyButtonsToCodeBlocks();
  }

  /**
   * Get last assistant message
   */
  get lastAssistantMessage(): ChatMessage | undefined {
    const assistantMessages = this.messages().filter((m) => m.role === 'assistant');
    return assistantMessages[assistantMessages.length - 1];
  }

  /**
   * Check if tool call is executing
   * @param toolCallId Tool call ID
   * @returns Whether is executing
   */
  isToolCallExecuting(toolCallId: string): boolean {
    // Can get from state management
    return false;
  }

  /**
   * Format time
   * @param timestamp Timestamp
   * @returns Formatted time
   */
  formatTime(timestamp: string): string {
    if (!timestamp) {
      return '';
    }

    // Backend returns UTC time without 'Z' suffix (e.g., "2026-03-07T13:57:49.516000")
    // Treat as UTC if no timezone suffix present
    let normalizedTimestamp = timestamp;
    // Check if timestamp ends with timezone indicator (Z, +08:00, -05:00, etc.)
    const hasTimezone = /(Z|[+-]\d{2}:\d{2})$/.test(timestamp);
    if (!hasTimezone) {
      normalizedTimestamp = timestamp + 'Z';
    }

    const date = new Date(normalizedTimestamp);
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  /**
   * Scroll to bottom
   */
  private scrollToBottom(): void {
    const messageContainer = this.messageContainer();
    if (messageContainer?.nativeElement) {
      const element = messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
      this.scrollToEnd.emit();
    }
  }

  /**
   * Track message ID (for optimized list rendering)
   * @param index Index
   * @param message Message
   * @returns Message ID
   */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  /**
   * Open tool call dialog
   * @param eventOrToolCall Mouse event or ToolCall from tool-call-display
   * @param toolCall Optional tool call (when called from inline click)
   */
  openToolCallDialog(eventOrToolCall: MouseEvent | ToolCall, toolCall?: ToolCall): void {
    // Handle both cases: (event, toolCall) or (toolCall) from tool-call-display
    let tc: ToolCall;

    if (toolCall !== undefined) {
      // Called as (event, toolCall) from inline click
      tc = toolCall;
    } else {
      // Called as (toolCall) from tool-call-display
      tc = eventOrToolCall as ToolCall;
    }

    const data: ToolDetailsDialogData = {
      type: 'tool_call',
      toolCall: tc,
    };

    this.dialog.open(ToolDetailsDialogComponent, {
      data,
      width: '800px',
      minWidth: '600px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      panelClass: ['tool-details-dialog'],
    });
  }

  /**
   * Open assistant tool result dialog (from assistant.message.tool_result)
   * @param result Tool result item
   */
  openAssistantToolResultDialog(result: ToolResult): void {
    const data: ToolDetailsDialogData = {
      type: 'tool_result',
      toolName: result.toolName,
      toolOutput: result.toolOutput,
    };

    this.dialog.open(ToolDetailsDialogComponent, {
      data,
      width: '800px',
      minWidth: '600px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      panelClass: ['tool-details-dialog'],
    });
  }

  /**
   * Send suggestion when user clicks on suggestion chip
   * @param suggestion Suggestion text
   */
  sendSuggestion(suggestion: string): void {
    this.suggestionClicked.emit(suggestion);
  }

  /**
   * Add copy buttons to all code blocks
   */
  private addCopyButtonsToCodeBlocks(): void {
    const container = this.messageContainer()?.nativeElement;
    if (!container) return;

    const codeBlocks = container.querySelectorAll('pre > code');

    codeBlocks.forEach((codeBlock: HTMLElement) => {
      const pre = codeBlock.parentElement;
      if (!pre || pre.classList.contains('code-copy-button-added')) return;

      // Mark as processed to avoid duplicate buttons
      pre.classList.add('code-copy-button-added');

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-button';
      copyButton.innerHTML = `
        <mat-icon class="code-copy-icon">content_copy</mat-icon>
        <span class="code-copy-text">Copy</span>
      `;
      copyButton.setAttribute('type', 'button');

      // Add click handler
      copyButton.addEventListener('click', () => {
        this.copyCode(codeBlock.textContent || '', copyButton);
      });

      // Add button to pre element
      pre.appendChild(copyButton);
    });
  }

  /**
   * Copy code to clipboard
   * @param code Code text
   * @param button Copy button element
   */
  private copyCode(code: string, button: HTMLElement): void {
    // Remove trailing newline that markdown often adds
    const codeToCopy = code.replace(/\n$/, '');

    navigator.clipboard.writeText(codeToCopy).then(
      () => {
        // Success - show feedback
        const icon = button.querySelector('.code-copy-icon');
        const text = button.querySelector('.code-copy-text');

        if (icon) icon.textContent = 'check';
        if (text) text.textContent = 'Copied!';
        button.classList.add('code-copy-button--copied');

        // Reset after 2 seconds
        setTimeout(() => {
          if (icon) icon.textContent = 'content_copy';
          if (text) text.textContent = 'Copy';
          button.classList.remove('code-copy-button--copied');
        }, 2000);
      },
      (err) => {
        console.error('Failed to copy code:', err);
      }
    );
  }
}
