import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatMessage, ToolCall } from '@models/ai-chat.interface';
import { ToolCallDisplayComponent } from './tool-call-display.component';
import { DraggableToolDialogComponent } from './draggable-tool-dialog.component';
import { marked } from 'marked';

/**
 * AI Chat Message List Component
 * Displays chat message history with enhanced message types
 * Supports: user, assistant, system, tool_call, tool_result messages
 */
@Component({
  selector: 'app-chat-message-list',
  styleUrls: ['./chat-message-list.component.scss', './_markdown-content.scss'],
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
              <span class="avatar-text">AI</span>
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
                  [isExecuting]="isToolCallExecuting(toolCall.id)"
                  (viewDetails)="openToolCallDialog($event)">
                </app-tool-call-display>
              </div>

              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <!-- Tool call message (inline display) -->
          <div class="message tool-call-message" *ngIf="message.role === 'tool_call'">
            <div class="inline-tool-call" (click)="openToolCallDialog($event, message.toolCall!)">
              <mat-icon class="tool-icon">build</mat-icon>
              <span class="tool-name-text">{{ message.toolCall?.function.name }}</span>
              <mat-icon class="expand-icon">open_in_new</mat-icon>
            </div>
          </div>

          <!-- Tool result message (inline display) -->
          <div class="message tool-result-message" *ngIf="message.role === 'tool_result'">
            <div class="inline-tool-result" (click)="openToolResultDialog($event, message)">
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
              <div class="tool-header" (click)="toggleToolResult(message.id)">
                <div class="tool-name">
                  <mat-icon class="expand-icon">{{ isToolResultExpanded(message.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                  <span>{{ message.name || 'Tool' }}</span>
                </div>
                <span class="tool-summary" *ngIf="!isToolResultExpanded(message.id)">{{ getToolResultSummary(message.content) }}</span>
              </div>
              <div class="tool-bubble" *ngIf="isToolResultExpanded(message.id)">
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

  // Tool result expand/collapse state
  private expandedToolResults = new Set<string>();

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

    try {
      // Use marked library for full markdown support
      const html = marked.parse(content, { async: false }) as string;
      return html;
    } catch (e) {
      // Fallback to simple rendering if marked fails
      return this.escapeHtml(content);
    }
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
      // Try to parse as JSON
      const parsed = JSON.parse(result);

      // Check if it's an array of device results (common format)
      if (Array.isArray(parsed)) {
        return this.formatDeviceResults(parsed);
      }

      // Single object - format as JSON
      return this.formatJsonWithHighlight(parsed);
    } catch (e) {
      // Not JSON - treat as plain text (Cisco IOS output)
      return this.formatCiscoOutput(result);
    }
  }

  /**
   * Format device diagnostic results (array of devices)
   */
  private formatDeviceResults(devices: any[]): string {
    let html = '<div class="device-results">';

    for (const device of devices) {
      const status = device.status === 'success' ? 'success' : 'error';
      const statusColor = device.status === 'success' ? '#22c55e' : '#ef4444';

      html += `
        <div class="device-result">
          <div class="device-header">
            <span class="device-name">${this.escapeHtml(device.device_name || 'Unknown')}</span>
            <span class="device-status" style="color: ${statusColor}">${status}</span>
          </div>`;

      if (device.output) {
        html += `<div class="device-output"><pre>${this.formatCiscoOutput(device.output)}</pre></div>`;
      }

      if (device.diagnostic_commands) {
        html += `<div class="device-commands">Commands: ${this.escapeHtml(device.diagnostic_commands.join(', '))}</div>`;
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Format JSON with syntax highlighting
   */
  private formatJsonWithHighlight(obj: any): string {
    const json = JSON.stringify(obj, null, 2);
    return this.syntaxHighlightJson(json);
  }

  /**
   * Format Cisco IOS command output with basic highlighting
   */
  private formatCiscoOutput(output: string): string {
    if (!output) return '';

    let formatted = this.escapeHtml(output);

    // Highlight Cisco IOS commands (lines starting with certain patterns)
    formatted = formatted
      // Command prompts like "R1#", "R2#show", etc.
      .replace(/^([A-Z][A-Za-z0-9]*)#(\S*)/gm, '<span class="cisco-prompt">$1#$2</span>')
      // Interface names
      .replace(/\b(GigabitEthernet|Serial|FastEthernet|Ethernet|Loopback|Port-channel|Tunnel|Vlan)\d*\/\d*(\.\d+)?(\s|$)/g, '<span class="cisco-interface">$&</span>')
      // IP addresses
      .replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/\d{1,2})?\b/g, '<span class="cisco-ip">$1$2</span>')
      // OSPF area, router ID
      .replace(/\b(area \d+|router-id \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/gi, '<span class="cisco-ospf">$1</span>')
      // Network statements
      .replace(/\b(network \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3} \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3} area \d+)\b/gi, '<span class="cisco-network">$1</span>')
      // Show commands
      .replace(/\b(show \S+)/g, '<span class="cisco-command">$1</span>')
      // Config keywords
      .replace(/\b(interface|router|ip address|no shutdown|description|hostname|router ospf|network|passive-interface|redistribute)\b/gi, '<span class="cisco-keyword">$1</span>')
      // Protocol states
      .replace(/\b(UP|DOWN|FULL|DR|BDR|2WAY|EXSTART|EXCHANGE|LOADING|FULL)\b/g, '<span class="cisco-state">$1</span>')
      // Success rate
      .replace(/(\d+)\s*packets input.*?(\d+)\s*errors?/gi, '<span class="cisco-errors">$1 packets, $2 errors</span>');

    return formatted;
  }

  /**
   * Syntax highlight JSON
   */
  private syntaxHighlightJson(json: string): string {
    return json
      .replace(/&quot;/g, '"')
      .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: &quot;(.*?)&quot;/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: (null)/g, ': <span class="json-null">$1</span>');
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

    // Fix: Treat timestamp as UTC if no timezone suffix
    // Backend returns UTC time without 'Z' suffix (e.g., "2026-03-06T16:31:36.547762")
    // Check for timezone suffix: 'Z' or '+08:00' or '-05:00' (at the end of string)
    const hasTimezone = /[Z+-]\d{2}:?\d{2}$/.test(timestamp);
    const normalizedTimestamp = hasTimezone ? timestamp : timestamp + 'Z';

    const date = new Date(normalizedTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // Debug log (只打印一次)
    if (!this['timeDebugLogged']) {
      console.log('[ChatMessageList] === Time Format Debug ===');
      console.log('[ChatMessageList] Raw timestamp:', timestamp);
      console.log('[ChatMessageList] Has timezone suffix:', hasTimezone);
      console.log('[ChatMessageList] Normalized timestamp:', normalizedTimestamp);
      console.log('[ChatMessageList] Parsed date (ISO):', date.toISOString());
      console.log('[ChatMessageList] Parsed date (Local):', date.toLocaleString());
      console.log('[ChatMessageList] Current time:', now.toLocaleString());
      console.log('[ChatMessageList] Diff minutes:', diffMins);
      this['timeDebugLogged'] = true;
    }

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
  openToolCallDialog(event: MouseEvent | ToolCall, toolCall?: ToolCall): void {
    // Handle both cases: (event, toolCall) or (toolCall) from tool-call-display
    let tc: ToolCall;
    let triggerElement: HTMLElement | null = null;

    if (toolCall !== undefined) {
      // Called as (event, toolCall)
      tc = toolCall;
      const mouseEvent = event as MouseEvent;
      triggerElement = mouseEvent.target as HTMLElement;
    } else {
      // Called as (toolCall) from tool-call-display
      tc = event as ToolCall;
    }

    this.currentToolCall = tc;
    this.toolCallDialogOpen = true;

    // Position dialog near trigger element, or center if no element
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      this.dialogPosition = this.calculateDialogPosition(rect);
    } else {
      this.dialogPosition = this.getCenterPosition();
    }
  }

  /**
   * Calculate dialog position near trigger element
   * @param rect Bounding rectangle of trigger element
   * @returns Position object
   */
  private calculateDialogPosition(rect: DOMRect): { top: number; left: number } {
    const dialogWidth = 700;
    const dialogHeight = 500;
    const offset = 10;

    let left = rect.right + offset;
    let top = rect.top;

    // If dialog would go off right edge, position to the left of the element
    if (left + dialogWidth > window.innerWidth) {
      left = rect.left - dialogWidth - offset;
    }

    // If dialog would go off left edge, center horizontally
    if (left < 0) {
      left = (window.innerWidth - dialogWidth) / 2;
    }

    // If dialog would go off bottom edge, position above the element
    if (top + dialogHeight > window.innerHeight) {
      top = window.innerHeight - dialogHeight - offset;
    }

    // Ensure minimum margins
    left = Math.max(10, left);
    top = Math.max(10, top);

    return { top, left };
  }

  /**
   * Get centered position in viewport
   * @returns Position object
   */
  private getCenterPosition(): { top: number; left: number } {
    return {
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
  openToolResultDialog(event: MouseEvent, message: ChatMessage): void {
    this.currentToolResult = message;
    this.toolResultDialogOpen = true;

    // Position dialog near trigger element
    const triggerElement = event.target as HTMLElement;
    const rect = triggerElement.getBoundingClientRect();
    this.dialogPosition = this.calculateDialogPosition(rect);
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

  /**
   * Toggle tool result expand/collapse
   * @param messageId Message ID
   */
  toggleToolResult(messageId: string): void {
    if (this.expandedToolResults.has(messageId)) {
      this.expandedToolResults.delete(messageId);
    } else {
      this.expandedToolResults.add(messageId);
    }
  }

  /**
   * Check if tool result is expanded
   * @param messageId Message ID
   * @returns Whether expanded
   */
  isToolResultExpanded(messageId: string): boolean {
    return this.expandedToolResults.has(messageId);
  }

  /**
   * Get summary of tool result for collapsed state
   * @param content Tool result content
   * @returns Summary string
   */
  getToolResultSummary(content: string): string {
    if (!content) {
      return 'Empty result';
    }

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        // Array of device results
        const devices = parsed.map(d => d.device_name || 'Unknown').join(', ');
        return `${parsed.length} device(s): ${devices}`;
      }

      // Single object
      if (parsed.device_name) {
        return `${parsed.device_name}: ${parsed.status || 'completed'}`;
      }

      return 'JSON result';
    } catch (e) {
      // Plain text - show first line or truncate
      const firstLine = content.split('\n')[0];
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
  }
}
