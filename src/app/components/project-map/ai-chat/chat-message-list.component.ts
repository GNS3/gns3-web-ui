import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewChecked, ElementRef, ViewChild, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
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
  styleUrls: ['./chat-message-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-message-list" #messageContainer [class.auto-scroll]="autoScroll">
      <div class="messages-container">
        <ng-container *ngFor="let message of messages; trackBy: trackByMessageId">
          <!-- User message -->
          <div class="message user-message" *ngIf="message.role === 'user'">
            <div class="message-avatar user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <div class="message-content user-content">
              <div class="message-bubble user-bubble">
                <markdown class="message-text prose prose-sm dark:prose-invert max-w-none min-w-0 prose-p:break-words prose-ul:break-words prose-ol:break-words prose-pre:break-all prose-a:break-all prose-code:break-all" [data]="message.content"></markdown>
              </div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- AI assistant message -->
          <div class="message assistant-message" *ngIf="message.role === 'assistant'">
            <div class="message-avatar assistant-avatar">
              <span class="avatar-text">AI</span>
            </div>
            <div class="message-content assistant-content">
              <div class="message-bubble assistant-bubble" [class.streaming]="isStreaming && message === lastAssistantMessage">
                <markdown class="message-text prose prose-sm dark:prose-invert max-w-none min-w-0 prose-p:break-words prose-ul:break-words prose-ol:break-words prose-pre:break-all prose-a:break-all prose-code:break-all" [data]="message.content"></markdown>
                <mat-spinner *ngIf="isStreaming && message === lastAssistantMessage" diameter="16" class="streaming-indicator"></mat-spinner>
              </div>

              <!-- Tool calls list -->
              <div class="tool-calls-container" *ngIf="message.tool_calls && message.tool_calls.length > 0">
                <app-tool-call-display
                  *ngFor="let toolCall of message.tool_calls"
                  [toolCall]="toolCall"
                  [isExecuting]="isToolCallExecuting(toolCall.id)"
                  (viewDetails)="openToolCallDialog($event)">
                </app-tool-call-display>
              </div>

              <!-- Tool results list -->
              <div class="tool-results-container" *ngIf="message.tool_result && message.tool_result.length > 0">
                <div
                  class="inline-tool-result"
                  *ngFor="let result of message.tool_result"
                  (click)="openAssistantToolResultDialog(result)">
                  <mat-icon class="tool-icon">check_circle</mat-icon>
                  <span class="tool-name-text">{{ result.toolName }}</span>
                  <mat-icon class="expand-icon">open_in_new</mat-icon>
                </div>
              </div>

              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- System message -->
          <div class="message system-message" *ngIf="message.role === 'system'">
            <div class="message-bubble system-bubble">
              <markdown class="message-text prose prose-sm dark:prose-invert max-w-none min-w-0 prose-p:break-words prose-ul:break-words prose-ol:break-words prose-pre:break-all prose-a:break-all prose-code:break-all" [data]="message.content"></markdown>
            </div>
          </div>

          <!-- Error message -->
          <div class="message error-message" *ngIf="message.metadata?.error">
            <div class="message-bubble error-bubble">
              <mat-icon class="error-icon">error</mat-icon>
              <div class="message-text">{{ message.metadata.error }}</div>
            </div>
          </div>
        </ng-container>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="messages.length === 0">
          <div class="empty-content">
            <div class="empty-icon-wrapper">
              <mat-icon class="empty-icon">smart_toy</mat-icon>
            </div>
            <h3 class="empty-title">Welcome to GNS3 AI Assistant</h3>
            <p class="empty-description">Ask me anything about network automation and GNS3</p>
            <div class="empty-suggestions">
              <div class="suggestion-chip" (click)="sendSuggestion('Help me understand this network topology')">
                <mat-icon>help_outline</mat-icon>
                <span>Explain network topology</span>
              </div>
              <div class="suggestion-chip" (click)="sendSuggestion('Analyze the network configuration')">
                <mat-icon>analytics</mat-icon>
                <span>Analyze configuration</span>
              </div>
              <div class="suggestion-chip" (click)="sendSuggestion('Find potential network issues')">
                <mat-icon>search</mat-icon>
                <span>Find network issues</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatMessageListComponent implements OnChanges, AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() isStreaming = false;
  @Input() autoScroll = true;

  @Output() scrollToEnd = new EventEmitter<void>();
  @Output() suggestionClicked = new EventEmitter<string>();

  @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;

  private shouldScrollToBottom = false;

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Mark need to scroll to bottom when messages change
    if (changes['messages'] && changes['messages'].previousValue !== changes['messages'].currentValue) {
      this.shouldScrollToBottom = true;
    }
  }

  ngAfterViewChecked(): void {
    // Scroll to bottom if needed and auto-scroll is enabled
    if (this.shouldScrollToBottom && this.autoScroll) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Get last assistant message
   */
  get lastAssistantMessage(): ChatMessage | undefined {
    const assistantMessages = this.messages.filter(m => m.role === 'assistant');
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
        minute: '2-digit'
      });
    }
  }

  /**
   * Scroll to bottom
   */
  private scrollToBottom(): void {
    if (this.messageContainer?.nativeElement) {
      const element = this.messageContainer.nativeElement;
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
      toolCall: tc
    };

    this.dialog.open(ToolDetailsDialogComponent, {
      data,
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      panelClass: 'tool-details-dialog'
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
      toolOutput: result.toolOutput
    };

    this.dialog.open(ToolDetailsDialogComponent, {
      data,
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      panelClass: 'tool-details-dialog'
    });
  }

  /**
   * Send suggestion when user clicks on suggestion chip
   * @param suggestion Suggestion text
   */
  sendSuggestion(suggestion: string): void {
    this.suggestionClicked.emit(suggestion);
  }
}
