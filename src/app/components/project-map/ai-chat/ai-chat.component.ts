import {
  Component,
  Input,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../environments/environment';

import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ChatMessage, ChatSession, ChatEvent, ToolCall, ToolResult } from '@models/ai-chat.interface';
import { LLMModelConfigWithSource, CopilotMode } from '@models/ai-profile';
import { AiChatService } from '@services/ai-chat.service';
import { ControllerService } from '@services/controller.service';
import { AiProfilesService } from '@services/ai-profiles.service';
import { LoginService } from '@services/login.service';
import { AiChatStore } from '../../../stores/ai-chat.store';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { getModelDisplayName, shortenModelName } from '@utils/ai-profile.util';
import { ChatSessionListComponent } from './chat-session-list.component';
import { ChatMessageListComponent } from './chat-message-list.component';
import { ChatInputAreaComponent } from './chat-input-area.component';

/**
 * HTTP Error response shape (simplified for type safety)
 */
interface HttpErrorLike {
  error?: { message?: string };
  message?: string;
  statusText?: string;
}

/**
 * AI Chat Main Component
 * Integrates all sub-components and handles main business logic
 */
@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ResizableDirective,
    ResizeHandleDirective,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    ChatSessionListComponent,
    ChatMessageListComponent,
    ChatInputAreaComponent,
  ],
})
export class AiChatComponent implements OnInit, OnDestroy, OnChanges {
  // Layout constants
  private static readonly TOOLBAR_HEIGHT_DESKTOP = 64;
  private static readonly TOOLBAR_HEIGHT_MOBILE = 56;
  private static readonly MOBILE_BREAKPOINT = 768;
  private static readonly MIN_PANEL_WIDTH = 500;
  private static readonly MIN_PANEL_HEIGHT = 400;

  readonly project = input.required<Project>();
  @Input() controller!: Controller;
  readonly zIndex = input<number>(1000);

  @Output() closed = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();

  // UI state
  sidebarCollapsed = true;
  isStreaming = false;
  isDraggingEnabled = false;
  isMaximized = false;
  isMinimized = false;

  // Position and size state
  public style: object = {};
  private previousStyle: object = {}; // Save state before maximize
  public resizedWidth: number = 0;
  public resizedHeight: number = 0;

  // Data
  sessions: ChatSession[] = [];
  currentSessionId: string | null = null;
  currentMessages: ChatMessage[] = [];

  // LLM Model Configuration
  modelConfigs: LLMModelConfigWithSource[] = [];
  currentModelId: string | null = null;
  currentCopilotMode: CopilotMode = 'teaching_assistant';
  isLoadingModels = false;

  // Tool call accumulation state
  private currentToolCalls = new Map<string, ToolCall>();
  private currentAssistantMessage: ChatMessage | null = null;

  private destroy$ = new Subject<void>();

  // Debounce timer for panel state updates
  private saveStateTimer: any = null;
  private dragRafId: number | null = null;

  private aiChatService = inject(AiChatService);
  private controllerService = inject(ControllerService);
  private aiProfilesService = inject(AiProfilesService);
  private loginService = inject(LoginService);
  private aiChatStore = inject(AiChatStore);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private boundaryService = inject(WindowBoundaryService);

  constructor() {}

  /**
   * Error logger - always enabled
   */
  private logError(...args: any[]): void {
    console.error('[AI Chat Error]', ...args);
  }

  ngOnInit() {
    // Set top offset to keep AI Chat below toolbar
    const toolbarHeight =
      window.innerWidth <= AiChatComponent.MOBILE_BREAKPOINT
        ? AiChatComponent.TOOLBAR_HEIGHT_MOBILE
        : AiChatComponent.TOOLBAR_HEIGHT_DESKTOP;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });

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
   * Handle window resize events to keep AI Chat within viewport boundaries
   * This ensures the window stays visible when browser window is resized
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    // Skip if minimized or maximized
    if (this.isMinimized || this.isMaximized) {
      return;
    }

    // Re-constrain window position to stay within viewport
    this.style = this.boundaryService.constrainWindowPosition(this.style as WindowStyle);
    this.cdr.markForCheck();
  }

  /**
   * Initialize chat
   */
  private initializeChat(): void {
    const project = this.project();
    if (!project || !this.controller) {
      return;
    }

    // Reset service layer session_id to prevent reusing old session when returning to project
    this.aiChatService.resetCurrentSession();

    // Set current project
    this.aiChatStore.setCurrentProjectId(project.project_id);

    // Load saved panel state
    this.loadPanelState();

    // Load sessions list
    this.loadSessions();

    // Load model configurations
    this.loadModelConfigs();
  }

  /**
   * Load panel state from store
   * Store is the single source of truth for all default values
   */
  private loadPanelState(): void {
    const panelState = this.aiChatStore.getPanelStateValue();

    this.isMaximized = panelState.isMaximized || false;
    this.isMinimized = panelState.isMinimized || false;

    // Store provides default width/height values (800x900)
    const width = panelState.width || 800;
    const height = panelState.height || 900;
    const pos = panelState.position;

    // Build style from store state
    this.style = {
      position: 'fixed',
      top: pos?.top !== undefined ? `${pos.top}px` : '80px',
      right: pos?.right !== undefined ? `${pos.right}px` : undefined,
      left: pos?.left !== undefined ? `${pos.left}px` : undefined,
      width: `${width}px`,
      height: `${height}px`,
    };

    // Save for restore
    this.previousStyle = { ...this.style };
    this.resizedWidth = width;
    this.resizedHeight = height;

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
    this.aiChatStore
      .getSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          this.sessions = sessions;
          this.cdr.markForCheck(); // Trigger change detection
        },
        error: (err) => {
          this.logError('Failed to subscribe to sessions:', err);
          this.showError(err || 'Failed to load sessions');
        },
      });

    // Subscribe to current session
    this.aiChatStore
      .getCurrentSessionId()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessionId) => {
          this.currentSessionId = sessionId;
          // Only load session messages if not currently streaming
          // This prevents clearing the current conversation while streaming is active
          if (sessionId && !this.isStreaming) {
            this.loadSessionMessages(sessionId);
          }
          this.cdr.markForCheck(); // Trigger change detection
        },
        error: (err) => {
          this.logError('Failed to subscribe to current session:', err);
        },
      });

    // Subscribe to streaming state
    this.aiChatStore
      .getStreamingState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (streaming) => {
          this.isStreaming = streaming;
          this.cdr.markForCheck(); // Trigger change detection
        },
        error: (err) => {
          this.logError('Failed to subscribe to streaming state:', err);
        },
      });

    // Subscribe to panel state changes
    this.aiChatStore
      .getPanelState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (panelState) => {
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

        // If was maximized and now is not maximized, restore the previous size
        if (wasMaximized && !panelState.isMaximized && !panelState.isMinimized) {
          // Restore previous style with boundary check
          if (Object.keys(this.previousStyle).length > 0) {
            const constrainedStyle = this.boundaryService.constrainWindowPosition(this.previousStyle);
            this.style = constrainedStyle;
            // Update resizedWidth and resizedHeight from previous style
            const width = constrainedStyle['width'] as string;
            const height = constrainedStyle['height'] as string;
            if (width) {
              this.resizedWidth = Number(width.split('px')[0]);
            }
            if (height) {
              this.resizedHeight = Number(height.split('px')[0]);
            }
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.logError('Failed to subscribe to panel state:', err);
      },
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

      this.aiChatService
        .getSessions(this.controller, this.project().project_id)
        .pipe(
          tap((sessions) => {
            this.aiChatStore.setSessions(sessions);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          error: (error) => {
            this.logError('Failed to load sessions:', error);
            // Display the actual error message from server
            this.showError(error || 'Failed to load sessions');
          },
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

      this.aiChatService
        .getSessionHistory(this.controller, this.project().project_id, sessionId)
        .pipe(
          tap((history) => {
            // Convert legacy role:tool messages to assistant.tool_result format
            const convertedMessages = this.convertLegacyToolMessages(history.messages);
            this.aiChatStore.setMessages(sessionId, convertedMessages);
            this.currentMessages = convertedMessages;
            this.cdr.markForCheck(); // Trigger change detection immediately
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          error: (error) => {
            this.logError('Failed to load session history:', error);
            this.showError('Failed to load session history');
          },
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
    this.aiChatService.resetCurrentSession(); // Clear service layer session_id
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

      this.aiChatService
        .renameSession(this.controller, this.project().project_id, event.sessionId, event.title)
        .pipe(
          tap((updatedSession) => {
            this.aiChatStore.updateSession(updatedSession);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          error: (error) => {
            this.logError('Failed to rename session:', error);
            this.showError('Failed to rename session');
          },
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

      this.aiChatService
        .pinSession(this.controller, this.project().project_id, sessionId)
        .pipe(
          tap((updatedSession) => {
            this.aiChatStore.updateSession(updatedSession);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          error: (error) => {
            this.logError('Failed to pin session:', error);
            this.showError('Failed to pin session');
          },
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

      this.aiChatService
        .unpinSession(this.controller, this.project().project_id, sessionId)
        .pipe(
          tap((updatedSession) => {
            this.aiChatStore.updateSession(updatedSession);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          error: (error) => {
            this.logError('Failed to unpin session:', error);
            this.showError('Failed to unpin session');
          },
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
      created_at: new Date().toISOString(),
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
    this.controllerService
      .get(this.controller.id)
      .then((freshController: Controller) => {
        // Update the controller reference
        this.controller = freshController;

        this.aiChatStore.setStreamingState(true);
        this.aiChatStore.clearError();

        this.aiChatService
          .streamChat(this.controller, this.project().project_id, {
            message,
            session_id: sessionId,
            stream: true,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (event: ChatEvent) => {
              this.handleChatEvent(event);
            },
            error: (error) => {
              this.logError('Chat stream error:', error);
              this.aiChatStore.setStreamingState(false);
              // Display the actual error message from server
              this.showError(error || 'Chat error occurred');
            },
            complete: () => {
              this.aiChatStore.setStreamingState(false);
              this.currentToolCalls.clear();
              this.currentAssistantMessage = null;
            },
          });
      })
      .catch((error) => {
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
        this.handleToolStartEvent(event);
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
        created_at: new Date().toISOString(),
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

    // If no currentAssistantMessage, create one
    if (!this.currentAssistantMessage) {
      this.currentAssistantMessage = {
        id: event.message_id || this.generateMessageId(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        tool_calls: [],
      };
      this.currentMessages = [...this.currentMessages, this.currentAssistantMessage];
    }

    // Add to assistant message's tool_calls
    if (!this.currentAssistantMessage.tool_calls) {
      this.currentAssistantMessage.tool_calls = [];
    }

    const existingCall = this.currentAssistantMessage.tool_calls.find((tc) => tc.id === toolCall.id);
    if (!existingCall) {
      this.currentAssistantMessage.tool_calls.push({ ...toolCall });
    } else {
      // Update parameters
      existingCall.function.arguments = toolCall.function.arguments;
      existingCall.function.complete = toolCall.function.complete;
    }

    // Update tool call in state management
    this.aiChatStore.addOrUpdateToolCall(toolCall);
    this.cdr.markForCheck();
  }

  /**
   * Handle tool start event - tool call finished, execution started
   * @param event Event
   */
  private handleToolStartEvent(event: ChatEvent): void {
    // Mark the tool call as executing
    if (event.tool_call_id && this.currentAssistantMessage?.tool_calls) {
      const toolCall = this.currentAssistantMessage.tool_calls.find((tc) => tc.id === event.tool_call_id);
      if (toolCall) {
        // Mark as executing (will be used to show executing status)
        (toolCall as any).isExecuting = true;
        this.currentMessages = [...this.currentMessages];
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Handle tool end event
   * @param event Event
   */
  private handleToolEndEvent(event: ChatEvent): void {
    // Find the assistant message that contains this tool_call
    let targetAssistant: ChatMessage | null = null;

    if (event.tool_call_id) {
      // Find by tool_call_id
      for (let i = this.currentMessages.length - 1; i >= 0; i--) {
        const msg = this.currentMessages[i];
        if (msg.role === 'assistant' && msg.tool_calls) {
          const found = msg.tool_calls.find((tc) => tc.id === event.tool_call_id);
          if (found) {
            targetAssistant = msg;
            break;
          }
        }
      }
    }

    // Fallback to currentAssistantMessage
    if (!targetAssistant) {
      targetAssistant = this.currentAssistantMessage;
    }

    if (targetAssistant) {
      // Add tool_result to existing assistant message
      if (!targetAssistant.tool_result) {
        targetAssistant.tool_result = [];
      }
      targetAssistant.tool_result.push({
        toolName: event.tool_name || '',
        toolOutput: event.tool_output || '',
        tool_call_id: event.tool_call_id,
      });
      // Trigger change detection
      this.currentMessages = [...this.currentMessages];
      this.cdr.markForCheck();

      // Reset currentAssistantMessage so next content creates a new message
      this.currentAssistantMessage = null;
    } else {
      // Fallback: create a new assistant message with tool_result
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        tool_result: [
          {
            toolName: event.tool_name || '',
            toolOutput: event.tool_output || '',
            tool_call_id: event.tool_call_id,
          },
        ],
      };
      this.currentMessages = [...this.currentMessages, assistantMessage];
    }
    this.cdr.markForCheck();
  }

  /**
   * Get current session title
   */
  get currentSessionTitle(): string {
    const currentSession = this.sessions.find((s) => s.thread_id === this.currentSessionId);
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
   * Handle window focus (bring to front)
   */
  onWindowFocus(): void {
    this.windowFocused.emit();
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
   * @param error Error message or error object
   */
  private showError(error: string | HttpErrorLike): void {
    // Extract error message if it's an object
    let errorMessage: string;
    if (typeof error === 'string') {
      errorMessage = error;
    } else {
      // It's an object (HttpErrorResponse), extract the message
      // Prioritize server response body message
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.statusText) {
        errorMessage = error.statusText;
      } else {
        errorMessage = 'An unknown error occurred';
      }
    }

    // Truncate error message if too long (max 300 characters)
    const maxLength = 300;
    let displayMessage = errorMessage;
    if (displayMessage.length > maxLength) {
      displayMessage = displayMessage.substring(0, maxLength) + '...';
    }

    this.aiChatStore.setError(errorMessage);

    // Parse and format error message for user-friendly display
    const friendlyMessage = this.parseErrorMessage(displayMessage);

    // Show error using Material Snackbar
    this.snackBar.open(friendlyMessage, 'Close', {
      duration: 6000,
      panelClass: ['ai-chat-snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      politeness: 'assertive',
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
        '403': "Access denied. You don't have permission to perform this action.",
        '404': 'Resource not found. The requested resource may have been deleted.',
        '429': 'Too many requests. Please wait a moment and try again.',
        '500': 'Server error. Please try again later.',
        '503': 'Service temporarily unavailable. Please try again later.',
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
      AuthenticationError: 'Authentication failed. Please check your credentials.',
      PermissionDenied: "You don't have permission to access this resource.",
      ConnectionError: 'Failed to connect to the server. Please check your network.',
      TimeoutError: 'Request timed out. Please try again.',
      ValidationError: 'Invalid input. Please check your data and try again.',
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
    const randomBytes = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      // Fallback for environments without crypto support
      for (let i = 0; i < randomBytes.length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const randomStr = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `msg_${Date.now()}_${randomStr}`;
  }

  /**
   * Convert legacy role:tool messages to assistant.tool_result format
   * @param messages Original messages
   * @returns Converted messages
   */
  private convertLegacyToolMessages(messages: ChatMessage[]): ChatMessage[] {
    const converted: ChatMessage[] = [];
    let lastAssistantIndex = -1;

    for (const msg of messages) {
      if (msg.role === 'tool') {
        // Convert role:tool to assistant.tool_result
        if (lastAssistantIndex >= 0) {
          const lastAssistant = converted[lastAssistantIndex];
          if (!lastAssistant.tool_result) {
            lastAssistant.tool_result = [];
          }
          lastAssistant.tool_result.push({
            toolName: msg.name || '',
            toolOutput: msg.content || '',
            tool_call_id: msg.tool_call_id,
          });
        } else {
          // No assistant message before, create one with tool_result
          const newAssistant: ChatMessage = {
            id: this.generateMessageId(),
            role: 'assistant',
            content: '',
            created_at: msg.created_at,
            tool_result: [
              {
                toolName: msg.name || '',
                toolOutput: msg.content || '',
                tool_call_id: msg.tool_call_id,
              },
            ],
          };
          converted.push(newAssistant);
          lastAssistantIndex = converted.length - 1;
        }
      } else {
        converted.push({ ...msg });
        if (msg.role === 'assistant') {
          lastAssistantIndex = converted.length - 1;
        }
      }
    }

    return converted;
  }

  /**
   * Generate UUID v4
   * @returns UUID string
   */
  private generateUUID(): string {
    // Generate UUID using cryptographically secure random values
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Fallback for environments without crypto support
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    // Set version bits to 4 (UUID v4) and variant bits to RFC 4122
    bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Variant

    // Format as UUID string
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join('-');
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
   * Handle drag event with RAF optimization and boundary checks
   * @param event Mouse event
   */
  dragWidget(event: MouseEvent): void {
    // Cancel previous RAF if exists
    if (this.dragRafId !== null) {
      cancelAnimationFrame(this.dragRafId);
    }

    // Schedule update on next animation frame
    this.dragRafId = requestAnimationFrame(() => {
      // Use boundary service to constrain position
      this.style = this.boundaryService.constrainDragPosition(this.style, event.movementX, event.movementY);

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
      (event.rectangle.width < AiChatComponent.MIN_PANEL_WIDTH ||
        event.rectangle.height < AiChatComponent.MIN_PANEL_HEIGHT)
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
    // Use boundary service to constrain size
    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width || this.resizedWidth,
      event.rectangle.height || this.resizedHeight,
      event.rectangle.left,
      event.rectangle.top
    );

    // Determine if using left or right based on current style
    const hasLeft = this.style['left'] !== undefined;

    // Build position style based on original positioning
    const positionStyle: any = {
      position: 'fixed',
      top: constrained.top !== undefined ? `${constrained.top}px` : this.style['top'],
    };

    // Preserve the original horizontal positioning (left or right)
    if (hasLeft) {
      positionStyle.left = constrained.left !== undefined ? `${constrained.left}px` : this.style['left'];
    } else {
      // Calculate right from left + width
      const right = window.innerWidth - (constrained.left || 0) - constrained.width;
      positionStyle.right = `${right}px`;
    }

    this.style = {
      ...positionStyle,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`,
    };
    this.resizedWidth = constrained.width;
    this.resizedHeight = constrained.height;

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

  /**
   * Load user's LLM model configurations
   */
  private loadModelConfigs(): void {
    if (!this.controller) {
      return;
    }

    this.isLoadingModels = true;
    this.cdr.markForCheck();

    // Get current user
    this.loginService
      .getLoggedUser(this.controller)
      .then((user: any) => {
        if (!user) {
          this.isLoadingModels = false;
          this.cdr.markForCheck();
          return;
        }

        this.aiProfilesService
          .getConfigs(this.controller, user.user_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.modelConfigs = response.configs || [];
              this.currentModelId = response.default_config?.config_id || null;
              // Load copilot mode from default config
              this.currentCopilotMode = response.default_config?.config?.copilot_mode || 'teaching_assistant';
              this.isLoadingModels = false;
              this.cdr.markForCheck();
            },
            error: (error) => {
              this.logError('Failed to load model configs:', error);
              this.modelConfigs = [];
              this.currentModelId = null;
              this.isLoadingModels = false;
              this.cdr.markForCheck();
            },
          });
      })
      .catch((error) => {
        this.logError('Failed to get logged user:', error);
        this.isLoadingModels = false;
        this.cdr.markForCheck();
      });
  }

  /**
   * Handle model selection
   * @param config Selected model configuration
   */
  onModelSelected(config: LLMModelConfigWithSource): void {
    if (!this.controller) {
      return;
    }

    // Get current user
    this.loginService
      .getLoggedUser(this.controller)
      .then((user: any) => {
        if (!user) {
          this.showError('Failed to get user information');
          return;
        }

        this.aiProfilesService
          .setDefaultConfig(this.controller, user.user_id, config.config_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedConfig) => {
              this.currentModelId = updatedConfig.config_id;
              // Update copilot mode from the newly set default config
              this.currentCopilotMode = updatedConfig.config?.copilot_mode || 'teaching_assistant';
              this.cdr.markForCheck();

              // Show success message
              const modelName = shortenModelName(config.config.model);
              this.snackBar.open(`Switched to ${modelName}`, 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              });
            },
            error: (error) => {
              this.logError('Failed to set default model:', error);
              this.showError('Failed to switch model');
            },
          });
      })
      .catch((error) => {
        this.logError('Failed to get logged user:', error);
        this.showError('Failed to get user information');
      });
  }

  /**
   * Handle copilot mode selection
   * @param mode Selected copilot mode
   */
  onCopilotModeSelected(mode: CopilotMode): void {
    if (!this.controller || !this.currentModelId) {
      return;
    }

    // Get current user
    this.loginService
      .getLoggedUser(this.controller)
      .then((user: any) => {
        if (!user) {
          this.showError('Failed to get user information');
          return;
        }

        // Update the current default config with new copilot mode
        this.aiProfilesService
          .updateConfig(this.controller, user.user_id, this.currentModelId, { copilot_mode: mode })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedConfig) => {
              this.currentCopilotMode = updatedConfig.config?.copilot_mode || 'teaching_assistant';
              this.cdr.markForCheck();

              // Show success message
              const modeName = mode === 'teaching_assistant' ? 'Teaching Assistant' : 'Lab Automation';
              this.snackBar.open(`Switched to ${modeName} mode`, 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              });
            },
            error: (error) => {
              this.logError('Failed to update copilot mode:', error);
              this.showError('Failed to switch copilot mode');
            },
          });
      })
      .catch((error) => {
        this.logError('Failed to get logged user:', error);
        this.showError('Failed to get user information');
      });
  }

  /**
   * Handle abort button click
   * Aborts the current streaming session
   */
  onAbortClicked(): void {
    if (!this.controller || !this.isStreaming) {
      return;
    }

    // Get the current session ID
    const sessionId = this.currentSessionId || this.aiChatService.getCurrentSessionId();
    if (!sessionId) {
      this.logError('No session ID to abort');
      return;
    }

    // Get fresh controller
    this.controllerService.get(this.controller.id).then((freshController: Controller) => {
      this.controller = freshController;

      this.aiChatService
        .abortChat(this.controller, this.project().project_id, sessionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Abort successful, streaming state will be updated by stream completion
            this.logError('Chat aborted successfully');
          },
          error: (error) => {
            this.logError('Failed to abort chat:', error);
            this.showError('Failed to abort chat');
          },
        });
    });
  }
}
