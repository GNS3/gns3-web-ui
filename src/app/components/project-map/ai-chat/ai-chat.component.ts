import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject } from 'rxjs';
import { takeUntil, filter, tap } from 'rxjs/operators';

import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ChatMessage, ChatSession, ChatEvent, ToolCall } from '@models/ai-chat.interface';
import { AiChatService } from '@services/ai-chat.service';
import { AiChatStore } from '@stores/ai-chat.store';
import { ChatSessionListComponent } from './chat-session-list.component';
import { ChatMessageListComponent } from './chat-message-list.component';
import { ChatInputAreaComponent } from './chat-input-area.component';

/**
 * AI Chat Main Component
 * Integrates all sub-components and handles main business logic
 */
@Component({
  selector: 'app-ai-chat',
  template: `
    <div class="ai-chat-container" *ngIf="project && controller">
      <!-- Session sidebar -->
      <div class="chat-sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <h3 class="sidebar-title">
            <span class="ai-logo">AI</span>
            <span class="sidebar-text">Assistant</span>
          </h3>
          <button mat-icon-button (click)="toggleSidebar()" class="collapse-button">
            <mat-icon>{{ sidebarCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <div class="sidebar-content" *ngIf="!sidebarCollapsed">
          <app-chat-session-list
            [sessions]="sessions"
            [currentSessionId]="currentSessionId"
            (sessionSelected)="onSessionSelected($event)"
            (sessionCreated)="onSessionCreated()"
            (sessionRenamed)="onSessionRenamed($event)"
            (sessionDeleted)="onSessionDeleted($event)"
            (sessionPinned)="onSessionPinned($event)"
            (sessionUnpinned)="onSessionUnpinned($event)"
          ></app-chat-session-list>
        </div>
      </div>

      <!-- Chat main area -->
      <div class="chat-main">
        <!-- Chat header -->
        <div class="chat-header" *ngIf="!sidebarCollapsed">
          <div class="chat-title">
            <span class="ai-logo-small">AI</span>
            <span>{{ currentSessionTitle }}</span>
          </div>
          <button mat-icon-button (click)="closeChat()" class="close-button">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Messages list -->
        <div class="chat-messages" *ngIf="!sidebarCollapsed">
          <app-chat-message-list
            [messages]="currentMessages"
            [isStreaming]="isStreaming"
            (scrollToEnd)="onScrollToEnd()">
          </app-chat-message-list>
        </div>

        <!-- Input area -->
        <div class="chat-input" *ngIf="!sidebarCollapsed">
          <app-chat-input-area
            [disabled]="isStreaming"
            (messageSent)="onMessageSent($event)">
          </app-chat-input-area>
        </div>

        <!-- Collapsed state hint -->
        <div class="collapsed-hint" *ngIf="sidebarCollapsed">
          <mat-icon>smart_toy</mat-icon>
          <span>AI Assistant</span>
        </div>
      </div>
    </div>

    <!-- Error notification -->
    <div class="chat-error" *ngIf="errorMessage">
      <mat-icon>error</mat-icon>
      <span>{{ errorMessage }}</span>
      <button mat-icon-button (click)="clearError()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .ai-chat-container {
      display: flex;
      height: 100%;
      background-color: var(--mat-app-background);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .chat-sidebar {
      width: 280px;
      background-color: var(--mat-app-surface-container);
      border-right: 1px solid var(--mat-app-outline-variant);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
    }

    .chat-sidebar.collapsed {
      width: 48px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid var(--mat-app-outline-variant);
    }

    .sidebar-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
    }

    .collapse-button {
      width: 32px;
      height: 32px;
    }

    .sidebar-content {
      flex: 1;
      overflow: hidden;
    }

    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--mat-app-background);
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--mat-app-outline-variant);
      background-color: var(--mat-app-surface);
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
    }

    .chat-icon {
      color: var(--mat-app-primary);
    }

    .close-button {
      width: 32px;
      height: 32px;
    }

    .chat-messages {
      flex: 1;
      overflow: hidden;
    }

    .chat-input {
      border-top: 1px solid var(--mat-app-outline-variant);
    }

    .collapsed-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      gap: 8px;
      color: var(--mat-app-on-surface-variant);
      font-size: 12px;
      text-align: center;
    }

    .collapsed-hint mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--mat-app-primary);
    }

    .chat-error {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: var(--mat-app-error-container);
      color: var(--mat-app-error-on-container);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    }

    .chat-error mat-icon {
      color: var(--mat-app-error-on-container);
    }

    @media (max-width: 768px) {
      .chat-sidebar {
        width: 100%;
        position: absolute;
        z-index: 100;
        height: 100%;
      }

      .chat-sidebar.collapsed {
        width: 0;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    ChatSessionListComponent,
    ChatMessageListComponent,
    ChatInputAreaComponent
  ]
})
export class AiChatComponent implements OnInit, OnDestroy, OnChanges {
  @Input() project!: Project;
  @Input() controller!: Controller;

  // UI state
  sidebarCollapsed = false;
  isStreaming = false;
  errorMessage: string | null = null;

  // Data
  sessions: ChatSession[] = [];
  currentSessionId: string | null = null;
  currentMessages: ChatMessage[] = [];

  // Tool call accumulation state
  private currentToolCalls = new Map<string, ToolCall>();
  private currentAssistantMessage: ChatMessage | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private aiChatService: AiChatService,
    private aiChatStore: AiChatStore
  ) {}

  ngOnInit(): void {
    this.initializeChat();
    this.subscribeToStateChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.project || changes.controller) {
      this.initializeChat();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }

  /**
   * Initialize chat
   */
  private initializeChat(): void {
    if (!this.project || !this.controller) {
      return;
    }

    // Set current project
    this.aiChatStore.setCurrentProjectId(this.project.project_id);

    // Load sessions list
    this.loadSessions();
  }

  /**
   * Subscribe to state changes
   */
  private subscribeToStateChanges(): void {
    // Subscribe to sessions list
    this.aiChatStore.getSessions().pipe(
      takeUntil(this.destroy$)
    ).subscribe(sessions => {
      this.sessions = sessions;
    });

    // Subscribe to current session
    this.aiChatStore.getCurrentSessionId().pipe(
      takeUntil(this.destroy$)
    ).subscribe(sessionId => {
      this.currentSessionId = sessionId;
      if (sessionId) {
        this.loadSessionMessages(sessionId);
      }
    });

    // Subscribe to streaming state
    this.aiChatStore.getStreamingState().pipe(
      takeUntil(this.destroy$)
    ).subscribe(streaming => {
      this.isStreaming = streaming;
    });

    // Subscribe to error state
    this.aiChatStore.getError().pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.errorMessage = error;
    });
  }

  /**
   * Load sessions list
   */
  private loadSessions(): void {
    if (!this.controller) {
      return;
    }

    this.aiChatService.getSessions(this.controller, this.project.project_id).pipe(
      tap(sessions => {
        this.aiChatStore.setSessions(sessions);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Failed to load sessions:', error);
        this.showError('Failed to load sessions');
      }
    });
  }

  /**
   * Load session messages
   * @param sessionId Session ID
   */
  private loadSessionMessages(sessionId: string): void {
    if (!this.controller) {
      return;
    }

    this.aiChatService.getSessionHistory(this.controller, this.project.project_id, sessionId).pipe(
      tap(history => {
        this.aiChatStore.setMessages(sessionId, history.messages);
        this.currentMessages = history.messages;
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Failed to load session history:', error);
        this.showError('Failed to load session history');
      }
    });
  }

  /**
   * Session selected event
   * @param sessionId Session ID
   */
  onSessionSelected(sessionId: string): void {
    this.aiChatStore.setCurrentSessionId(sessionId);
  }

  /**
   * Create new session event
   */
  onSessionCreated(): void {
    this.aiChatStore.setCurrentSessionId(null);
    this.currentMessages = [];
    this.currentToolCalls.clear();
  }

  /**
   * Session renamed event
   * @param event Rename event
   */
  onSessionRenamed(event: { sessionId: string; title: string }): void {
    if (!this.controller) {
      return;
    }

    this.aiChatService.renameSession(
      this.controller,
      this.project.project_id,
      event.sessionId,
      event.title
    ).pipe(
      tap(updatedSession => {
        this.aiChatStore.updateSession(updatedSession);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Failed to rename session:', error);
        this.showError('Failed to rename session');
      }
    });
  }

  /**
   * Session deleted event
   * @param sessionId Session ID
   */
  onSessionDeleted(sessionId: string): void {
    if (!this.controller) {
      return;
    }

    this.aiChatService.deleteSession(
      this.controller,
      this.project.project_id,
      sessionId
    ).pipe(
      tap(() => {
        this.aiChatStore.deleteSession(sessionId);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Failed to delete session:', error);
        this.showError('Failed to delete session');
      }
    });
  }

  /**
   * Session pinned event
   * @param sessionId Session ID
   */
  onSessionPinned(sessionId: string): void {
    if (!this.controller) {
      return;
    }

    this.aiChatService.pinSession(
      this.controller,
      this.project.project_id,
      sessionId
    ).pipe(
      tap(updatedSession => {
        this.aiChatStore.updateSession(updatedSession);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Failed to pin session:', error);
        this.showError('Failed to pin session');
      }
    });
  }

  /**
   * Session unpinned event
   * @param sessionId Session ID
   */
  onSessionUnpinned(sessionId: string): void {
    if (!this.controller) {
      return;
    }

    this.aiChatService.unpinSession(
      this.controller,
      this.project.project_id,
      sessionId
    ).pipe(
      tap(updatedSession => {
        this.aiChatStore.updateSession(updatedSession);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Failed to unpin session:', error);
        this.showError('Failed to unpin session');
      }
    });
  }

  /**
   * Message sent event
   * @param message Message content
   */
  onMessageSent(message: string): void {
    if (!this.controller || this.isStreaming) {
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };

    // Add to message list
    const updatedMessages = [...this.currentMessages, userMessage];
    this.currentMessages = updatedMessages;
    this.aiChatStore.addMessage(
      this.currentSessionId || 'temp',
      userMessage
    );

    // Start streaming chat
    this.startChatStream(message, this.currentSessionId || undefined);
  }

  /**
   * Start streaming chat
   * @param message Message content
   * @param sessionId Session ID (optional)
   */
  private startChatStream(message: string, sessionId?: string): void {
    if (!this.controller) {
      return;
    }

    this.aiChatStore.setStreamingState(true);
    this.aiChatStore.clearError();

    this.aiChatService.streamChat(this.controller, this.project.project_id, {
      message,
      session_id: sessionId,
      stream: true
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (event: ChatEvent) => {
        this.handleChatEvent(event);
      },
      error: (error) => {
        console.error('Chat stream error:', error);
        this.aiChatStore.setStreamingState(false);
        this.showError('Chat error occurred');
      },
      complete: () => {
        this.aiChatStore.setStreamingState(false);
        this.currentToolCalls.clear();
        this.currentAssistantMessage = null;
      }
    });
  }

  /**
   * Handle chat event
   * @param event Chat event
   */
  private handleChatEvent(event: ChatEvent): void {
    switch (event.type) {
      case 'content':
        this.handleContentEvent(event);
        break;
      case 'tool_call':
        this.handleToolCallEvent(event);
        break;
      case 'tool_start':
        // Tool started execution
        break;
      case 'tool_end':
        this.handleToolEndEvent(event);
        break;
      case 'error':
        this.showError(event.error || 'An error occurred');
        break;
      case 'done':
        // Stream ended, reload sessions list
        this.loadSessions();
        break;
    }
  }

  /**
   * Handle content event
   * @param event Event
   */
  private handleContentEvent(event: ChatEvent): void {
    if (!this.currentAssistantMessage) {
      // Create new assistant message
      this.currentAssistantMessage = {
        id: event.message_id || this.generateMessageId(),
        role: 'assistant',
        content: event.content || '',
        created_at: new Date().toISOString()
      };
      this.currentMessages = [...this.currentMessages, this.currentAssistantMessage];
    } else {
      // Append content
      this.currentAssistantMessage.content += event.content || '';
    }
  }

  /**
   * Handle tool call event
   * @param event Event
   */
  private handleToolCallEvent(event: ChatEvent): void {
    if (!event.tool_call) {
      return;
    }

    const toolCall = event.tool_call;

    // Update or add tool call
    this.currentToolCalls.set(toolCall.id, toolCall);

    // Add to assistant message's tool_calls if it's a new tool call
    if (this.currentAssistantMessage && !this.currentAssistantMessage.tool_calls) {
      this.currentAssistantMessage.tool_calls = [];
    }

    if (this.currentAssistantMessage) {
      const existingCall = this.currentAssistantMessage.tool_calls?.find(tc => tc.id === toolCall.id);
      if (!existingCall) {
        this.currentAssistantMessage.tool_calls?.push({ ...toolCall });
      } else {
        // Update parameters
        existingCall.function.arguments = toolCall.function.arguments;
        existingCall.function.complete = toolCall.function.complete;
      }
    }

    // Update tool call in state management
    this.aiChatStore.addOrUpdateToolCall(toolCall);
  }

  /**
   * Handle tool end event
   * @param event Event
   */
  private handleToolEndEvent(event: ChatEvent): void {
    // Create tool result message
    const toolMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'tool',
      content: event.tool_output || '',
      created_at: new Date().toISOString(),
      tool_call_id: event.tool_call_id,
      name: event.tool_name
    };

    this.currentMessages = [...this.currentMessages, toolMessage];
  }

  /**
   * Get current session title
   */
  get currentSessionTitle(): string {
    const currentSession = this.sessions.find(s => s.thread_id === this.currentSessionId);
    return currentSession?.title || 'New chat';
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Close chat
   */
  closeChat(): void {
    this.aiChatStore.closePanel();
    this.cleanup();
  }

  /**
   * Scroll to end event
   */
  onScrollToEnd(): void {
    // Can add additional logic here
  }

  /**
   * Show error
   * @param error Error message
   */
  private showError(error: string): void {
    this.errorMessage = error;
    this.aiChatStore.setError(error);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorMessage = null;
    this.aiChatStore.clearError();
  }

  /**
   * Generate message ID
   * @returns Message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.aiChatStore.resetSessionState();
  }
}
