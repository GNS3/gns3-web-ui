import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatSession, ChatMessage, ToolCall, ChatPanelState, SessionUIState, ToolCallUIState } from '@models/ai-chat.interface';

/**
 * AI Chat State Management Service
 * Uses RxJS BehaviorSubject to manage chat state
 */
@Injectable({
  providedIn: 'root'
})
export class AiChatStore {
  // Current project ID
  private currentProjectId$ = new BehaviorSubject<string | null>(null);

  // Current session ID
  private currentSessionId$ = new BehaviorSubject<string | null>(null);

  // Session list
  private sessions$ = new BehaviorSubject<ChatSession[]>([]);

  // Message history (Map: sessionId -> messages)
  private messagesMap = new Map<string, ChatMessage[]>();
  private messages$ = new BehaviorSubject<Map<string, ChatMessage[]>>(new Map());

  // Streaming state
  private isStreaming$ = new BehaviorSubject<boolean>(false);

  // Current tool call state (Map: toolCallId -> toolCall)
  private currentToolCalls$ = new BehaviorSubject<Map<string, ToolCall>>(new Map());

  // Error state
  private error$ = new BehaviorSubject<string | null>(null);

  // Panel state
  private panelState$ = new BehaviorSubject<ChatPanelState>({
    isOpen: false,
    width: 800,
    height: 900,
    isMaximized: false,
    isMinimized: false,
    position: {
      top: 80,
      right: 20
    }
  });

  // Session UI state (Map: sessionId -> uiState)
  private sessionUIStateMap = new Map<string, SessionUIState>();
  private sessionUIStates$ = new BehaviorSubject<Map<string, SessionUIState>>(new Map());

  constructor() {
    // Restore panel state from localStorage
    this.loadPanelState();
  }

  /* ==================== Project & Session State ==================== */

  /**
   * Set current project ID
   * @param projectId Project ID
   */
  setCurrentProjectId(projectId: string | null): void {
    this.currentProjectId$.next(projectId);
    if (projectId) {
      // Clear messages and sessions when switching projects
      this.messagesMap.clear();
      this.messages$.next(new Map());
      this.sessions$.next([]);
    }
  }

  /**
   * Get current project ID
   * @returns Project ID Observable
   */
  getCurrentProjectId(): Observable<string | null> {
    return this.currentProjectId$.asObservable();
  }

  /**
   * Get current project ID value
   * @returns Project ID
   */
  getCurrentProjectIdValue(): string | null {
    return this.currentProjectId$.value;
  }

  /**
   * Set current session ID
   * @param sessionId Session ID
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId$.next(sessionId);
  }

  /**
   * Get current session ID
   * @returns Session ID Observable
   */
  getCurrentSessionId(): Observable<string | null> {
    return this.currentSessionId$.asObservable();
  }

  /**
   * Get current session ID value
   * @returns Session ID
   */
  getCurrentSessionIdValue(): string | null {
    return this.currentSessionId$.value;
  }

  /* ==================== Sessions State ==================== */

  /**
   * Set session list
   * @param sessions Session list
   */
  setSessions(sessions: ChatSession[]): void {
    this.sessions$.next(sessions);
  }

  /**
   * Get session list
   * @returns Session list Observable
   */
  getSessions(): Observable<ChatSession[]> {
    return this.sessions$.asObservable();
  }

  /**
   * Get session list value
   * @returns Session list
   */
  getSessionsValue(): ChatSession[] {
    return this.sessions$.value;
  }

  /**
   * Add new session
   * @param session Session
   */
  addSession(session: ChatSession): void {
    const currentSessions = this.sessions$.value;
    this.sessions$.next([session, ...currentSessions]);
  }

  /**
   * Update session
   * @param session Session
   */
  updateSession(session: ChatSession): void {
    const currentSessions = this.sessions$.value;
    const index = currentSessions.findIndex(s => s.thread_id === session.thread_id);
    if (index !== -1) {
      const updatedSessions = [...currentSessions];
      updatedSessions[index] = session;
      this.sessions$.next(updatedSessions);
    }
  }

  /**
   * Delete session
   * @param sessionId Session ID
   */
  deleteSession(sessionId: string): void {
    const currentSessions = this.sessions$.value;
    this.sessions$.next(currentSessions.filter(s => s.thread_id !== sessionId));

    // Delete messages
    this.messagesMap.delete(sessionId);
    this.messages$.next(new Map(this.messagesMap));

    // If deleting the current session, reset current session
    if (this.currentSessionId$.value === sessionId) {
      this.currentSessionId$.next(null);
    }
  }

  /* ==================== Messages State ==================== */

  /**
   * Get messages for specified session
   * @param sessionId Session ID (optional, defaults to current session)
   * @returns Messages list Observable
   */
  getMessages(sessionId?: string): Observable<ChatMessage[]> {
    return new Observable<ChatMessage[]>(subscriber => {
      const targetSessionId = sessionId || this.currentSessionId$.value;

      if (!targetSessionId) {
        subscriber.next([]);
        return;
      }

      // Return messages for this session
      const messages = this.messagesMap.get(targetSessionId) || [];
      subscriber.next(messages);
    });
  }

  /**
   * Get messages value for specified session
   * @param sessionId Session ID (optional, defaults to current session)
   * @returns Messages list
   */
  getMessagesValue(sessionId?: string): ChatMessage[] {
    const targetSessionId = sessionId || this.currentSessionId$.value;
    if (!targetSessionId) {
      return [];
    }
    return this.messagesMap.get(targetSessionId) || [];
  }

  /**
   * Set session messages
   * @param sessionId Session ID
   * @param messages Messages list
   */
  setMessages(sessionId: string, messages: ChatMessage[]): void {
    this.messagesMap.set(sessionId, messages);
    this.messages$.next(new Map(this.messagesMap));
  }

  /**
   * Add message to session
   * @param sessionId Session ID
   * @param message Message
   */
  addMessage(sessionId: string, message: ChatMessage): void {
    const currentMessages = this.messagesMap.get(sessionId) || [];
    this.messagesMap.set(sessionId, [...currentMessages, message]);
    this.messages$.next(new Map(this.messagesMap));
  }

  /**
   * Update last message in session
   * @param sessionId Session ID
   * @param content New content
   */
  updateLastMessage(sessionId: string, content: string): void {
    const currentMessages = this.messagesMap.get(sessionId);
    if (currentMessages && currentMessages.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
      const updatedMessages = [...currentMessages];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + content
      };
      this.messagesMap.set(sessionId, updatedMessages);
      this.messages$.next(new Map(this.messagesMap));
    }
  }

  /**
   * Clear session messages
   * @param sessionId Session ID
   */
  clearMessages(sessionId: string): void {
    this.messagesMap.delete(sessionId);
    this.messages$.next(new Map(this.messagesMap));
  }

  /* ==================== Streaming State ==================== */

  /**
   * Set streaming state
   * @param streaming Whether streaming
   */
  setStreamingState(streaming: boolean): void {
    this.isStreaming$.next(streaming);
  }

  /**
   * Get streaming state
   * @returns Streaming state Observable
   */
  getStreamingState(): Observable<boolean> {
    return this.isStreaming$.asObservable();
  }

  /**
   * Get streaming state value
   * @returns Whether streaming
   */
  getStreamingStateValue(): boolean {
    return this.isStreaming$.value;
  }

  /* ==================== Tool Calls State ==================== */

  /**
   * Set current tool calls
   * @param toolCalls Tool call Map
   */
  setCurrentToolCalls(toolCalls: Map<string, ToolCall>): void {
    this.currentToolCalls$.next(new Map(toolCalls));
  }

  /**
   * Add or update tool call
   * @param toolCall Tool call
   */
  addOrUpdateToolCall(toolCall: ToolCall): void {
    const currentToolCalls = new Map(this.currentToolCalls$.value);
    currentToolCalls.set(toolCall.id, toolCall);
    this.currentToolCalls$.next(currentToolCalls);
  }

  /**
   * Remove tool call
   * @param toolCallId Tool call ID
   */
  removeToolCall(toolCallId: string): void {
    const currentToolCalls = new Map(this.currentToolCalls$.value);
    currentToolCalls.delete(toolCallId);
    this.currentToolCalls$.next(currentToolCalls);
  }

  /**
   * Clear all tool calls
   */
  clearToolCalls(): void {
    this.currentToolCalls$.next(new Map());
  }

  /**
   * Get tool call state
   * @returns Tool call Map Observable
   */
  getCurrentToolCalls(): Observable<Map<string, ToolCall>> {
    return this.currentToolCalls$.asObservable();
  }

  /**
   * Get tool call state value
   * @returns Tool call Map
   */
  getCurrentToolCallsValue(): Map<string, ToolCall> {
    return this.currentToolCalls$.value;
  }

  /* ==================== Error State ==================== */

  /**
   * Set error message
   * @param error Error message
   */
  setError(error: string | null): void {
    this.error$.next(error);
  }

  /**
   * Get error message
   * @returns Error message Observable
   */
  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error$.next(null);
  }

  /* ==================== Panel State ==================== */

  /**
   * Set panel state
   * @param state Panel state
   */
  setPanelState(state: Partial<ChatPanelState>): void {
    const currentState = this.panelState$.value;
    const newState = { ...currentState, ...state };
    this.panelState$.next(newState);
    this.savePanelState(newState);
  }

  /**
   * Get panel state
   * @returns Panel state Observable
   */
  getPanelState(): Observable<ChatPanelState> {
    return this.panelState$.asObservable();
  }

  /**
   * Get panel state value
   * @returns Panel state
   */
  getPanelStateValue(): ChatPanelState {
    return this.panelState$.value;
  }

  /**
   * Open panel
   */
  openPanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({ ...currentState, isOpen: true });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Close panel
   */
  closePanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({ ...currentState, isOpen: false });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Maximize panel
   */
  maximizePanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({
      ...currentState,
      isMaximized: true,
      isMinimized: false
    });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Minimize panel
   */
  minimizePanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({
      ...currentState,
      isMaximized: false,
      isMinimized: true
    });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Restore panel (from maximized or minimized)
   */
  restorePanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({
      ...currentState,
      isMaximized: false,
      isMinimized: false
    });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Update panel position
   * @param position Position info
   */
  updatePanelPosition(position: { top?: number; right?: number; left?: number }): void {
    const currentState = this.panelState$.value;
    const newPosition = { ...currentState.position, ...position };
    this.panelState$.next({
      ...currentState,
      position: newPosition
    });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Update panel size
   * @param width Width
   * @param height Height
   */
  updatePanelSize(width: number, height: number): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({
      ...currentState,
      width,
      height
    });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * Save panel state to localStorage
   * @param state Panel state
   */
  private savePanelState(state: ChatPanelState): void {
    try {
      localStorage.setItem('ai-chat-panel-state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save panel state:', e);
    }
  }

  /**
   * Load panel state from localStorage
   */
  private loadPanelState(): void {
    try {
      const saved = localStorage.getItem('ai-chat-panel-state');
      if (saved) {
        const state: ChatPanelState = JSON.parse(saved);
        // Reset isOpen to false on page load since the panel is not actually visible
        state.isOpen = false;
        state.isMaximized = false;
        state.isMinimized = false;
        this.panelState$.next(state);
      }
    } catch (e) {
      console.error('Failed to load panel state:', e);
    }
  }

  /* ==================== Session UI State ==================== */

  /**
   * Set session UI state
   * @param sessionId Session ID
   * @param uiState UI state
   */
  setSessionUIState(sessionId: string, uiState: Partial<SessionUIState>): void {
    const currentStates = new Map(this.sessionUIStateMap);
    const currentState = currentStates.get(sessionId) || {
      isEditing: false,
      isExpanded: true
    };
    const newState = { ...currentState, ...uiState };
    currentStates.set(sessionId, newState);
    this.sessionUIStateMap = currentStates;
    this.sessionUIStates$.next(new Map(currentStates));
  }

  /**
   * Get session UI state
   * @param sessionId Session ID
   * @returns UI state Observable
   */
  getSessionUIState(sessionId: string): Observable<SessionUIState | undefined> {
    return new Observable<SessionUIState | undefined>(subscriber => {
      subscriber.next(this.sessionUIStateMap.get(sessionId));
    });
  }

  /**
   * Get session UI state value
   * @param sessionId Session ID
   * @returns UI state
   */
  getSessionUIStateValue(sessionId: string): SessionUIState | undefined {
    return this.sessionUIStateMap.get(sessionId);
  }

  /* ==================== Reset & Clear ==================== */

  /**
   * Reset all state
   */
  resetAll(): void {
    this.currentProjectId$.next(null);
    this.currentSessionId$.next(null);
    this.sessions$.next([]);
    this.messagesMap.clear();
    this.messages$.next(new Map());
    this.isStreaming$.next(false);
    this.currentToolCalls$.next(new Map());
    this.error$.next(null);
    this.sessionUIStateMap.clear();
    this.sessionUIStates$.next(new Map());
  }

  /**
   * Reset session-related state (keeping panel state)
   */
  resetSessionState(): void {
    this.currentSessionId$.next(null);
    this.messagesMap.clear();
    this.messages$.next(new Map());
    this.isStreaming$.next(false);
    this.currentToolCalls$.next(new Map());
    this.error$.next(null);
  }
}
