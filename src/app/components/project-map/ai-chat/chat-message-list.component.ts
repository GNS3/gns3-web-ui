import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatMessage, ToolCall } from '@models/ai-chat.interface';
import { ToolCallDisplayComponent } from './tool-call-display.component';

/**
 * AI Chat Message List Component
 * Displays chat message history
 */
@Component({
  selector: 'app-chat-message-list',
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
                <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
              </div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- AI assistant message -->
          <div class="message assistant-message" *ngIf="message.role === 'assistant'">
            <div class="message-avatar assistant-avatar">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <div class="message-content assistant-content">
              <div class="message-bubble assistant-bubble" [class.streaming]="isStreaming && message === lastAssistantMessage">
                <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
                <mat-spinner *ngIf="isStreaming && message === lastAssistantMessage" diameter="16" class="streaming-indicator"></mat-spinner>
              </div>

              <!-- Tool calls list -->
              <div class="tool-calls-container" *ngIf="message.tool_calls && message.tool_calls.length > 0">
                <app-tool-call-display
                  *ngFor="let toolCall of message.tool_calls"
                  [toolCall]="toolCall"
                  [isExecuting]="isToolCallExecuting(toolCall.id)">
                </app-tool-call-display>
              </div>

              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- Tool message -->
          <div class="message tool-message" *ngIf="message.role === 'tool'">
            <div class="message-avatar tool-avatar">
              <mat-icon>build</mat-icon>
            </div>
            <div class="message-content tool-content">
              <div class="message-bubble tool-bubble">
                <div class="tool-name">{{ message.name || 'Tool' }}</div>
                <pre class="tool-result" [innerHTML]="formatToolResult(message.content)"></pre>
              </div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- System message -->
          <div class="message system-message" *ngIf="message.role === 'system'">
            <div class="message-bubble system-bubble">
              <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
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
          <mat-icon class="empty-icon">chat_bubble_outline</mat-icon>
          <p class="empty-text">Start new conversation</p>
          <p class="empty-hint">Ask AI assistant about network topology</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-message-list {
      height: 100%;
      overflow-y: auto;
      padding: 16px;
      background-color: var(--mat-app-background);
    }

    .messages-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 8px;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-avatar {
      background-color: var(--mat-app-primary);
      color: var(--mat-app-on-primary);
    }

    .assistant-avatar {
      background-color: var(--mat-app-tertiary);
      color: var(--mat-app-on-tertiary);
    }

    .tool-avatar {
      background-color: var(--mat-app-secondary);
      color: var(--mat-app-on-secondary);
    }

    .message-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 80%;
    }

    .user-message {
      flex-direction: row-reverse;
    }

    .user-message .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      padding: 10px 14px;
      border-radius: 12px;
      position: relative;
    }

    .user-bubble {
      background-color: var(--mat-app-primary);
      color: var(--mat-app-on-primary);
      border-bottom-right-radius: 4px;
    }

    .assistant-bubble {
      background-color: var(--mat-app-surface-container);
      color: var(--mat-app-on-surface);
      border-bottom-left-radius: 4px;
    }

    .assistant-bubble.streaming {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .tool-bubble {
      background-color: var(--mat-app-surface-container-high);
      color: var(--mat-app-on-surface);
      border-radius: 8px;
      padding: 8px;
    }

    .system-bubble {
      background-color: var(--mat-app-surface-variant);
      color: var(--mat-app-on-surface-variant);
      text-align: center;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 16px;
      margin: 0 auto;
    }

    .error-bubble {
      background-color: var(--mat-app-error-container);
      color: var(--mat-app-error-on-container);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
    }

    .error-icon {
      color: var(--mat-app-error-on-container);
    }

    .message-text {
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .message-text code {
      background-color: rgba(0, 0, 0, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
    }

    .message-text pre {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 8px 0;
    }

    .message-text pre code {
      background-color: transparent;
      padding: 0;
    }

    .message-time {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.7;
      padding: 0 4px;
    }

    .streaming-indicator {
      flex-shrink: 0;
      margin-top: 4px;
    }

    .tool-calls-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .tool-name {
      font-weight: 500;
      font-size: 12px;
      color: var(--mat-app-on-surface-variant);
      margin-bottom: 4px;
    }

    .tool-result {
      margin: 0;
      padding: 8px;
      background-color: var(--mat-app-surface);
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      font-size: 64px;
      color: var(--mat-app-outline-variant);
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
      margin: 0 0 8px 0;
    }

    .empty-hint {
      font-size: 14px;
      color: var(--mat-app-on-surface-variant);
      margin: 0;
    }

    /* Scrollbar styles */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--mat-app-surface-container);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--mat-app-outline-variant);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--mat-app-outline);
    }

    /* Auto scroll styles */
    .auto-scroll {
      scroll-behavior: smooth;
    }
  `]
})
export class ChatMessageListComponent implements OnChanges, AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() isStreaming = false;
  @Input() autoScroll = true;

  @Output() scrollToEnd = new EventEmitter<void>();

  @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;

  private shouldScrollToBottom = false;

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
   * Format message content (supports simple Markdown)
   * @param content Message content
   * @returns Formatted HTML
   */
  formatMessage(content: string): string {
    if (!content) {
      return '';
    }

    // Escape HTML
    let formatted = this.escapeHtml(content);

    // Simple code block formatting ```code```
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Format tool result
   * @param result Tool result
   * @returns Formatted HTML
   */
  formatToolResult(result: string): string {
    if (!result) {
      return '';
    }

    try {
      // Try to format JSON
      const parsed = JSON.parse(result);
      return this.escapeHtml(JSON.stringify(parsed, null, 2));
    } catch (e) {
      return this.escapeHtml(result);
    }
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

    const date = new Date(timestamp);
    const now = new Date();
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
   * Escape HTML
   * @param text Text
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
}
