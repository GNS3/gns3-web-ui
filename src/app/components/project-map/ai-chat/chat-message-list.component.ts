import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatMessage, ToolCall } from '@models/ai-chat.interface';
import { ToolCallDisplayComponent } from './tool-call-display.component';
import { DraggableToolDialogComponent } from './draggable-tool-dialog.component';

/**
 * AI Chat Message List Component
 * Displays chat message history with enhanced message types
 * Supports: user, assistant, system, tool_call, tool_result messages
 */
@Component({
  selector: 'app-chat-message-list',
  template: `
    <div class="chat-message-list" #messageContainer [class.auto-scroll]="autoScroll">
      <div class="messages-container">
        <ng-container *ngFor="let message of messages; trackBy: trackByMessageId">
          <!-- User message -->
          <div class="message user-message" *ngIf="message.role === 'user'">
            <div class="message-content user-content">
              <div class="message-bubble user-bubble">
                <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
              </div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- AI assistant message -->
          <div class="message assistant-message" *ngIf="message.role === 'assistant'">
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
                  [isExecuting]="isToolCallExecuting(toolCall.id)"
                  (viewDetails)="openToolCallDialog($event)">
                </app-tool-call-display>
              </div>

              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- Tool call message (inline display) -->
          <div class="message tool-call-message" *ngIf="message.role === 'tool_call'">
            <div class="inline-tool-call" (click)="openToolCallDialog(message.toolCall!)">
              <mat-icon class="tool-icon">build</mat-icon>
              <span class="tool-name-text">{{ message.toolCall?.function.name }}</span>
              <mat-icon class="expand-icon">open_in_new</mat-icon>
            </div>
          </div>

          <!-- Tool result message (inline display) -->
          <div class="message tool-result-message" *ngIf="message.role === 'tool_result'">
            <div class="inline-tool-result" (click)="openToolResultDialog(message)">
              <mat-icon class="tool-icon">check_circle</mat-icon>
              <span class="tool-name-text">result</span>
              <mat-icon class="expand-icon">open_in_new</mat-icon>
            </div>
          </div>

          <!-- Legacy Tool message (for backward compatibility) -->
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

    <!-- Draggable Tool Call Dialog -->
    <app-draggable-tool-dialog
      [isOpen]="toolCallDialogOpen"
      [type]="'tool_call'"
      [toolCall]="currentToolCall"
      [initialPosition]="dialogPosition"
      (close)="closeToolCallDialog()">
    </app-draggable-tool-dialog>

    <!-- Draggable Tool Result Dialog -->
    <app-draggable-tool-dialog
      [isOpen]="toolResultDialogOpen"
      [type]="'tool_result'"
      [toolName]="currentToolResult?.toolName"
      [toolOutput]="currentToolResult?.toolOutput"
      [initialPosition]="dialogPosition"
      (close)="closeToolResultDialog()">
    </app-draggable-tool-dialog>
  `,
  styles: [`
    .chat-message-list {
      height: 100%;
      overflow-y: auto;
      padding: 16px;
      background-color: var(--mat-app-background);
      /* Custom scrollbar styling inspired by ChatGPT */
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    }

    /* WebKit scrollbar styling */
    .chat-message-list::-webkit-scrollbar {
      width: 6px;
    }

    .chat-message-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-message-list::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      transition: background-color 0.3s ease;
    }

    .chat-message-list::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.3);
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
      background: linear-gradient(135deg, var(--mat-app-primary), #7c4dff);
      color: var(--mat-app-on-primary);
    }

    .assistant-avatar {
      background: linear-gradient(135deg, var(--mat-app-tertiary), #00bcd4);
      color: var(--mat-app-on-tertiary);
    }

    .tool-avatar {
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;
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
      background: linear-gradient(135deg, var(--mat-app-primary), #7c4dff);
      color: var(--mat-app-on-primary);
      border-bottom-right-radius: 4px;
    }

    .assistant-bubble {
      background: var(--mat-app-surface-container);
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
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
      color: var(--mat-app-on-surface-variant);
      text-align: center;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 16px;
      margin: 0 auto;
      border: 1px solid rgba(255, 193, 7, 0.3);
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

    /* Tool call/result inline display styles */
    .tool-call-message,
    .tool-result-message {
      margin-left: 40px;
      margin-bottom: 4px;
    }

    .inline-tool-call,
    .inline-tool-result {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--mat-app-surface-container-low);
      border: 1px solid var(--mat-app-outline-variant);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .inline-tool-call:hover,
    .inline-tool-result:hover {
      background: var(--mat-app-surface-container);
      border-color: var(--mat-app-primary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .inline-tool-call .tool-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
      color: #ff9800;
    }

    .inline-tool-result .tool-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
      color: #4caf50;
    }

    .tool-name-text {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
    }

    .expand-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.5;
    }

    /* Enhanced empty state styles */
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 48px 24px;
    }

    .empty-content {
      text-align: center;
      max-width: 500px;
    }

    .empty-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, rgba(103, 58, 183, 0.1), rgba(63, 81, 181, 0.1));
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: var(--mat-app-primary);
    }

    .empty-title {
      font-size: 20px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
      margin: 0 0 8px 0;
    }

    .empty-description {
      font-size: 14px;
      color: var(--mat-app-on-surface-variant);
      margin: 0 0 24px 0;
    }

    .empty-suggestions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }

    .suggestion-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--mat-app-surface-container-low);
      border: 1px solid var(--mat-app-outline-variant);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      max-width: 280px;
      width: 100%;
      justify-content: center;
    }

    .suggestion-chip:hover {
      background: var(--mat-app-primary-container);
      border-color: var(--mat-app-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .suggestion-chip mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: var(--mat-app-primary);
    }

    .suggestion-chip span {
      font-size: 13px;
      color: var(--mat-app-on-surface);
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
  @Output() suggestionClicked = new EventEmitter<string>();

  @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;

  private shouldScrollToBottom = false;

  // Dialog state for tool calls
  toolCallDialogOpen = false;
  toolResultDialogOpen = false;
  currentToolCall?: ToolCall;
  currentToolResult?: ChatMessage;
  dialogPosition = { top: 100, left: 100 };

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

    // Debug: Log the raw timestamp
    console.log('[ChatMessageList] Raw timestamp:', timestamp);

    const date = new Date(timestamp);
    const now = new Date();

    // Debug: Log parsed date
    console.log('[ChatMessageList] Parsed date:', date.toString());
    console.log('[ChatMessageList] Local timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

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

  /**
   * Open tool call dialog
   * @param toolCall Tool call to display
   */
  openToolCallDialog(toolCall: ToolCall): void {
    this.currentToolCall = toolCall;
    this.toolCallDialogOpen = true;
    // Center dialog in viewport
    this.dialogPosition = {
      top: Math.max(100, window.innerHeight / 2 - 200),
      left: Math.max(100, window.innerWidth / 2 - 350)
    };
  }

  /**
   * Close tool call dialog
   */
  closeToolCallDialog(): void {
    this.toolCallDialogOpen = false;
  }

  /**
   * Open tool result dialog
   * @param message Tool result message
   */
  openToolResultDialog(message: ChatMessage): void {
    this.currentToolResult = message;
    this.toolResultDialogOpen = true;
    // Center dialog in viewport
    this.dialogPosition = {
      top: Math.max(100, window.innerHeight / 2 - 200),
      left: Math.max(100, window.innerWidth / 2 - 350)
    };
  }

  /**
   * Close tool result dialog
   */
  closeToolResultDialog(): void {
    this.toolResultDialogOpen = false;
  }

  /**
   * Send suggestion when user clicks on suggestion chip
   * @param suggestion Suggestion text
   */
  sendSuggestion(suggestion: string): void {
    this.suggestionClicked.emit(suggestion);
  }
}
