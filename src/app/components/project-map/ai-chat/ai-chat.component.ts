import { Component, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ResizeEvent } from 'angular-resizable-element';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ChatMessage, ChatSession, ChatEvent, ToolCall } from '@models/ai-chat.interface';
import { AiChatService } from '@services/ai-chat.service';
import { ControllerService } from '@services/controller.service';
import { AiChatStore } from '../../../stores/ai-chat.store';

/**
 * AI Chat Main Component
 * Integrates all sub-components and handles main business logic
 */
@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChatComponent implements OnInit, OnDestroy, OnChanges {
  @Input() project!: Project;
  @Input() controller!: Controller;

  @Output() closed = new EventEmitter<void>();

  // UI state
  sidebarCollapsed = false;
  isStreaming = false;
  isDraggingEnabled = false;
  isLightThemeEnabled = false;
  isMaximized = false;
  isMinimized = false;

  // Position and size state
  public style: object = {};
  private previousStyle: object = {}; // 保存最大化前的状态
  public resizedWidth: number = 700;
  public resizedHeight: number = 600;

  // Data
  sessions: ChatSession[] = [];
  currentSessionId: string | null = null;
  currentMessages: ChatMessage[] = [];

  // Tool call accumulation state
  private currentToolCalls = new Map<string, ToolCall>();
  private currentAssistantMessage: ChatMessage | null = null;

  private destroy$ = new Subject<void>();

  // Debounce timer for panel state updates
  private saveStateTimer: any = null;
  private dragRafId: number | null = null;

  constructor(
    private aiChatService: AiChatService,
    private controllerService: ControllerService,
    private aiChatStore: AiChatStore,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Logger method - disabled in production
   */
  private log(...args: any[]): void {
    if (!environment.production) {
      console.log('[AI Chat]', ...args);
    }
  }

  /**
   * Error logger - always enabled
   */
  private logError(...args: any[]): void {
    console.error('[AI Chat Error]', ...args);
  }

  ngOnInit() {
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

  /**
   * Initialize chat
   */
  private initializeChat(): void {
    if (!this.project || !this.controller) {
      return;
    }

    // Set current project
    this.aiChatStore.setCurrentProjectId(this.project.project_id);

    // Load saved panel state
    this.loadPanelState();

    // Load sessions list
    this.loadSessions();
  }

  /**
   * Load panel state from store
   */
  private loadPanelState(): void {
    const panelState = this.aiChatStore.getPanelStateValue();

    this.isMaximized = panelState.isMaximized || false;
    this.isMinimized = panelState.isMinimized || false;

    // Build style from saved state
    if (panelState.position) {
      const pos = panelState.position;
      this.style = {
        position: 'fixed',
        top: pos.top !== undefined ? `${pos.top}px` : '80px',
        right: pos.right !== undefined ? `${pos.right}px` : undefined,
        left: pos.left !== undefined ? `${pos.left}px` : undefined,
        width: `${panelState.width}px`,
        height: `${panelState.height}px`,
      };

      // Save for restore
      this.previousStyle = { ...this.style };
      this.resizedWidth = panelState.width;
      this.resizedHeight = panelState.height;
    } else {
      // Default style
      this.style = {
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: '700px',
        height: '600px',
      };
      this.previousStyle = { ...this.style };
    }

    // Update maximized state
    if (this.isMaximized) {
      this.applyMaximizedStyle();
    } else if (this.isMinimized) {
      this.applyMinimizedStyle();
    }
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
      this.cdr.markForCheck(); // Trigger change detection
    });

    // Subscribe to current session
    this.aiChatStore.getCurrentSessionId().pipe(
      takeUntil(this.destroy$)
    ).subscribe(sessionId => {
      this.currentSessionId = sessionId;
      // Only load session messages if not currently streaming
      // This prevents clearing the current conversation while streaming is active
      if (sessionId && !this.isStreaming) {
        this.loadSessionMessages(sessionId);
      }
      this.cdr.markForCheck(); // Trigger change detection
    });

    // Subscribe to streaming state
    this.aiChatStore.getStreamingState().pipe(
      takeUntil(this.destroy$)
    ).subscribe(streaming => {
      this.isStreaming = streaming;
      this.cdr.markForCheck(); // Trigger change detection
    });

    // Subscribe to panel state changes
    this.aiChatStore.getPanelState().pipe(
      takeUntil(this.destroy$)
    ).subscribe(panelState => {
      const wasMinimized = this.isMinimized;
      const wasMaximized = this.isMaximized;
      this.isMinimized = panelState.isMinimized;
      this.isMaximized = panelState.isMaximized;

      // If was minimized and now is not minimized, restore the chat
      if (wasMinimized && !panelState.isMinimized) {
        // Restore previous style
        if (Object.keys(this.previousStyle).length > 0) {
          this.style = { ...this.previousStyle };
        }
        this.cdr.markForCheck();
      }
      // If was not minimized and now is minimized, apply minimized style
      else if (!wasMinimized && panelState.isMinimized) {
        // Save current style before minimizing
        this.previousStyle = { ...this.style };
        // Apply minimized style (move off-screen)
        this.style = {
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '0px',
          height: '0px',
        };
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Load sessions list
   */
  private loadSessions(): void {
    if (!this.controller) {
      return;
    }

    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.controller = freshController;

      this.aiChatService.getSessions(this.controller, this.project.project_id).pipe(
        tap(sessions => {
          this.aiChatStore.setSessions(sessions);
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        error: (error) => {
          this.logError('Failed to load sessions:', error);
          this.showError('Failed to load sessions');
        }
      });
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

    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.controller = freshController;

      this.aiChatService.getSessionHistory(this.controller, this.project.project_id, sessionId).pipe(
        tap(history => {
          this.aiChatStore.setMessages(sessionId, history.messages);
          this.currentMessages = history.messages;
          this.cdr.markForCheck(); // Trigger change detection immediately
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        error: (error) => {
          this.logError('Failed to load session history:', error);
          this.showError('Failed to load session history');
        }
      });
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
    this.cdr.markForCheck(); // Trigger change detection
  }

  /**
   * Session renamed event
   * @param event Rename event
   */
  onSessionRenamed(event: { sessionId: string; title: string }): void {
    if (!this.controller) {
      return;
    }

    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.controller = freshController;

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
          this.logError('Failed to rename session:', error);
          this.showError('Failed to rename session');
        }
      });
    });
  }

  /**
   * Session deleted event
   * @param sessionId Session ID
   */
  onSessionDeleted(sessionId: string): void {
    // Remove from store after successful deletion
    this.aiChatStore.deleteSession(sessionId);

    // If deleted session was current, clear current session
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  /**
   * Session pinned event
   * @param sessionId Session ID
   */
  onSessionPinned(sessionId: string): void {
    if (!this.controller) {
      return;
    }

    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.controller = freshController;

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
          this.logError('Failed to pin session:', error);
          this.showError('Failed to pin session');
        }
      });
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

    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.controller = freshController;

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
          this.logError('Failed to unpin session:', error);
          this.showError('Failed to unpin session');
        }
      });
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

    // Generate or use existing session_id
    // If this is the first message in a new session, generate a UUID
    let sessionId = this.currentSessionId || this.aiChatService.getCurrentSessionId();

    if (!sessionId) {
      // Generate new session_id for new conversation
      sessionId = this.generateUUID();
      this.log('Generated new session_id:', sessionId);

      // Set streaming state BEFORE updating session_id
      // This prevents the subscriber from loading session history
      this.isStreaming = true;
      this.aiChatStore.setStreamingState(true);

      // Update store to track this session
      this.aiChatStore.setCurrentSessionId(sessionId);
    } else {
      // For existing sessions, also set streaming state early
      this.isStreaming = true;
      this.aiChatStore.setStreamingState(true);
    }

    // Save user message to store with the session_id
    this.aiChatStore.addMessage(sessionId, userMessage);

    this.cdr.markForCheck(); // Trigger change detection

    // Start streaming chat with the session_id
    this.log('Sending message with session_id:', sessionId);
    this.startChatStream(message, sessionId);
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

    // Reset current assistant message to avoid appending to previous message
    this.currentAssistantMessage = null;

    // Get fresh controller from localStorage to ensure we have the latest authToken
    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.log('Fresh controller loaded:', freshController);
      this.log('authToken present:', !!freshController.authToken);

      // Update the controller reference
      this.controller = freshController;

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
          this.logError('Chat stream error:', error);
          this.aiChatStore.setStreamingState(false);
          this.showError('Chat error occurred');
        },
        complete: () => {
          this.aiChatStore.setStreamingState(false);
          this.currentToolCalls.clear();
          this.currentAssistantMessage = null;
        }
      });
    }).catch((error) => {
      this.logError('Failed to get fresh controller:', error);
      this.showError('Failed to authenticate');
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
        // Stream ended, reload sessions list to update session metadata
        // Note: Don't update currentSessionId here to avoid triggering loadSessionMessages
        // The service layer already manages session_id internally
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
      this.cdr.markForCheck(); // Trigger change detection
    } else {
      // Append content - create new array reference to trigger ngOnChanges in child component
      this.currentAssistantMessage.content += event.content || '';
      // Create new array reference to trigger change detection for auto-scroll
      this.currentMessages = [...this.currentMessages];
      this.cdr.markForCheck(); // Trigger change detection for streaming updates
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
    this.cdr.markForCheck(); // Trigger change detection
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
    this.closed.emit();
  }

  /**
   * Maximize chat
   */
  maximizeChat(): void {
    if (this.isMaximized) {
      this.restoreChat();
      return;
    }

    // Save current state
    this.previousStyle = { ...this.style };

    this.isMaximized = true;
    this.isMinimized = false;
    this.aiChatStore.maximizePanel();
    this.applyMaximizedStyle();
  }

  /**
   * Minimize chat
   * Note: Actual minimization is handled by panel state subscription
   */
  minimizeChat(): void {
    if (this.isMinimized) {
      this.restoreChat();
      return;
    }

    // Save current state before minimizing
    this.previousStyle = { ...this.style };

    // Update store state - subscription will handle the actual minimization
    this.isMaximized = false;
    this.aiChatStore.minimizePanel();
  }

  /**
   * Restore chat
   * Note: Actual restoration is handled by panel state subscription
   */
  restoreChat(): void {
    // Update store state - subscription will handle the actual restoration
    this.aiChatStore.restorePanel();
  }

  /**
   * Apply maximized style
   */
  private applyMaximizedStyle(): void {
    this.style = {
      position: 'fixed',
      top: '0',
      right: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
    };
  }

  /**
   * Apply minimized style
   * Hide the window completely when minimized (use sidebar AI button instead)
   */
  private applyMinimizedStyle(): void {
    // Move window off-screen to hide it completely
    this.style = {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      width: '0px',
      height: '0px',
    };
  }

  /**
   * Scroll to end event
   */
  onScrollToEnd(): void {
    // Can add additional logic here
  }

  /**
   * Handle suggestion clicked event
   * @param suggestion Suggestion text that was clicked
   */
  onSuggestionClicked(suggestion: string): void {
    // Send the suggestion as a message
    this.onMessageSent(suggestion);
  }

  /**
   * Show error using Material Snackbar
   * @param error Error message
   */
  private showError(error: string): void {
    this.aiChatStore.setError(error);

    // Parse and format error message for user-friendly display
    const friendlyMessage = this.parseErrorMessage(error);

    // Show error using Material Snackbar
    this.snackBar.open(friendlyMessage, 'Close', {
      duration: 6000,
      panelClass: ['ai-chat-snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      politeness: 'assertive'
    });
  }

  /**
   * Parse error message and convert to user-friendly format
   * @param error Raw error message
   * @returns Formatted error message
   */
  private parseErrorMessage(error: string): string {
    if (!error) {
      return 'An unknown error occurred';
    }

    // Handle Python dict-style error: "Error code: 401 - {'error': {'message': 'Missing Authentication header', 'code': 401}}"
    const dictMatch = error.match(/Error code:\s*(\d+)\s*-\s*{.*?['"]message['"]:\s*['"]([^'"]+)['"]/);
    if (dictMatch) {
      const code = dictMatch[1];
      const message = dictMatch[2];

      // Map common error codes to friendly messages
      const friendlyMessages: Record<string, string> = {
        '401': 'Authentication failed. Please check your API key or login again.',
        '403': 'Access denied. You don\'t have permission to perform this action.',
        '404': 'Resource not found. The requested resource may have been deleted.',
        '429': 'Too many requests. Please wait a moment and try again.',
        '500': 'Server error. Please try again later.',
        '503': 'Service temporarily unavailable. Please try again later.'
      };

      // Use friendly message if available, otherwise use the original message
      return friendlyMessages[code] || message;
    }

    // Handle JSON-style error: {"error": {"message": "...", "code": 401}}
    if (error.includes('{') && error.includes('}')) {
      try {
        const parsed = JSON.parse(error.replace(/'/g, '"'));
        if (parsed.error?.message) {
          return this.parseErrorMessage(parsed.error.message);
        }
      } catch (e) {
        // Not valid JSON, continue processing
      }
    }

    // Handle "Error code: XXX - YYY" format
    const errorCodeMatch = error.match(/Error code:\s*(\d+)\s*-\s*(.+)/);
    if (errorCodeMatch) {
      const code = errorCodeMatch[1];
      const message = errorCodeMatch[2];
      return `Error (${code}): ${message}`;
    }

    // Handle common Python exception messages
    const pythonExceptions: Record<string, string> = {
      'AuthenticationError': 'Authentication failed. Please check your credentials.',
      'PermissionDenied': 'You don\'t have permission to access this resource.',
      'ConnectionError': 'Failed to connect to the server. Please check your network.',
      'TimeoutError': 'Request timed out. Please try again.',
      'ValidationError': 'Invalid input. Please check your data and try again.'
    };

    for (const [exception, friendly] of Object.entries(pythonExceptions)) {
      if (error.includes(exception)) {
        return friendly;
      }
    }

    // Return original error if no patterns match
    return error;
  }

  /**
   * Clear error from store (Snackbar handles its own dismissal)
   */
  clearError(): void {
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
   * Generate UUID v4
   * @returns UUID string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Toggle dragging state
   * @param value Dragging enabled
   */
  toggleDragging(value: boolean): void {
    this.isDraggingEnabled = value;
    // Save position when dragging ends
    if (!value) {
      this.debouncedSavePanelState();
    }
  }

  /**
   * Handle drag event with RAF optimization
   * @param event Mouse event
   */
  dragWidget(event: MouseEvent): void {
    // Cancel previous RAF if exists
    if (this.dragRafId !== null) {
      cancelAnimationFrame(this.dragRafId);
    }

    // Schedule update on next animation frame
    this.dragRafId = requestAnimationFrame(() => {
      const x: number = event.movementX;
      const y: number = event.movementY;

      const width: number = Number(this.style['width'].split('px')[0]);
      const height: number = Number(this.style['height'].split('px')[0]);
      const right: number = Number(this.style['right'].split('px')[0]) - x;
      const top: number = Number(this.style['top'].split('px')[0]) + y;

      this.style = {
        position: 'fixed',
        right: `${right}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };

      // Trigger change detection manually
      this.cdr.markForCheck();
    });
  }

  /**
   * Validate resize event
   * @param event Resize event
   * @returns Whether resize is valid
   */
  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < 500 || event.rectangle.height < 400)
    ) {
      return false;
    }
    return true;
  }

  /**
   * Handle resize end event with debounced state save
   * @param event Resize event
   */
  onResizeEnd(event: ResizeEvent): void {
    this.style = {
      position: 'fixed',
      top: this.style['top'],
      right: this.style['right'],
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };
    this.resizedWidth = event.rectangle.width;
    this.resizedHeight = event.rectangle.height;

    // Debounced state save
    this.debouncedSavePanelState();
  }

  /**
   * Debounced panel state save (300ms delay)
   */
  private debouncedSavePanelState(): void {
    if (this.saveStateTimer) {
      clearTimeout(this.saveStateTimer);
    }

    this.saveStateTimer = setTimeout(() => {
      const top = Number(this.style['top']?.split('px')[0]);
      const right = Number(this.style['right']?.split('px')[0]);
      const width = Number(this.style['width']?.split('px')[0]);
      const height = Number(this.style['height']?.split('px')[0]);

      // Save size to store
      if (!isNaN(width) && !isNaN(height)) {
        this.aiChatStore.updatePanelSize(width, height);
      }

      // Save position to store
      if (!isNaN(top) && !isNaN(right)) {
        this.aiChatStore.updatePanelPosition({ top, right });
      }
    }, 300);
  }

  /**
   * Cleanup function
   */
  private cleanup(): void {
    // Reset session state
    this.aiChatStore.resetSessionState();

    // Clear any pending timers
    if (this.saveStateTimer) {
      clearTimeout(this.saveStateTimer);
      this.saveStateTimer = null;
    }

    if (this.dragRafId !== null) {
      cancelAnimationFrame(this.dragRafId);
      this.dragRafId = null;
    }
  }
}
