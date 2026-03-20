import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatSession, ChatMessage, ToolCall, ChatPanelState, SessionUIState, ToolCallUIState } from '@models/ai-chat.interface';

/**
 * AI Chat 状态管理服务
 * 使用 RxJS BehaviorSubject 管理聊天状态
 */
@Injectable({
  providedIn: 'root'
})
export class AiChatStore {
  // 当前项目 ID
  private currentProjectId$ = new BehaviorSubject<string | null>(null);

  // 当前会话 ID
  private currentSessionId$ = new BehaviorSubject<string | null>(null);

  // 会话列表
  private sessions$ = new BehaviorSubject<ChatSession[]>([]);

  // 消息历史 (Map: sessionId -> messages)
  private messagesMap = new Map<string, ChatMessage[]>();
  private messages$ = new BehaviorSubject<Map<string, ChatMessage[]>>(new Map());

  // 流式状态
  private isStreaming$ = new BehaviorSubject<boolean>(false);

  // 当前工具调用状态 (Map: toolCallId -> toolCall)
  private currentToolCalls$ = new BehaviorSubject<Map<string, ToolCall>>(new Map());

  // 错误状态
  private error$ = new BehaviorSubject<string | null>(null);

  // 面板状态
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

  // 会话 UI 状态 (Map: sessionId -> uiState)
  private sessionUIStateMap = new Map<string, SessionUIState>();
  private sessionUIStates$ = new BehaviorSubject<Map<string, SessionUIState>>(new Map());

  constructor() {
    // 从 localStorage 恢复面板状态
    this.loadPanelState();
  }

  /* ==================== Project & Session State ==================== */

  /**
   * 设置当前项目 ID
   * @param projectId 项目 ID
   */
  setCurrentProjectId(projectId: string | null): void {
    this.currentProjectId$.next(projectId);
    if (projectId) {
      // 切换项目时，清空消息和会话
      this.messagesMap.clear();
      this.messages$.next(new Map());
      this.sessions$.next([]);
    }
  }

  /**
   * 获取当前项目 ID
   * @returns 项目 ID Observable
   */
  getCurrentProjectId(): Observable<string | null> {
    return this.currentProjectId$.asObservable();
  }

  /**
   * 获取当前项目 ID 的当前值
   * @returns 项目 ID
   */
  getCurrentProjectIdValue(): string | null {
    return this.currentProjectId$.value;
  }

  /**
   * 设置当前会话 ID
   * @param sessionId 会话 ID
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId$.next(sessionId);
  }

  /**
   * 获取当前会话 ID
   * @returns 会话 ID Observable
   */
  getCurrentSessionId(): Observable<string | null> {
    return this.currentSessionId$.asObservable();
  }

  /**
   * 获取当前会话 ID 的当前值
   * @returns 会话 ID
   */
  getCurrentSessionIdValue(): string | null {
    return this.currentSessionId$.value;
  }

  /* ==================== Sessions State ==================== */

  /**
   * 设置会话列表
   * @param sessions 会话列表
   */
  setSessions(sessions: ChatSession[]): void {
    this.sessions$.next(sessions);
  }

  /**
   * 获取会话列表
   * @returns 会话列表 Observable
   */
  getSessions(): Observable<ChatSession[]> {
    return this.sessions$.asObservable();
  }

  /**
   * 获取会话列表的当前值
   * @returns 会话列表
   */
  getSessionsValue(): ChatSession[] {
    return this.sessions$.value;
  }

  /**
   * 添加新会话
   * @param session 会话
   */
  addSession(session: ChatSession): void {
    const currentSessions = this.sessions$.value;
    this.sessions$.next([session, ...currentSessions]);
  }

  /**
   * 更新会话
   * @param session 会话
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
   * 删除会话
   * @param sessionId 会话 ID
   */
  deleteSession(sessionId: string): void {
    const currentSessions = this.sessions$.value;
    this.sessions$.next(currentSessions.filter(s => s.thread_id !== sessionId));

    // 删除消息
    this.messagesMap.delete(sessionId);
    this.messages$.next(new Map(this.messagesMap));

    // 如果删除的是当前会话，重置当前会话
    if (this.currentSessionId$.value === sessionId) {
      this.currentSessionId$.next(null);
    }
  }

  /* ==================== Messages State ==================== */

  /**
   * 获取指定会话的消息
   * @param sessionId 会话 ID（可选，默认当前会话）
   * @returns 消息列表 Observable
   */
  getMessages(sessionId?: string): Observable<ChatMessage[]> {
    return new Observable<ChatMessage[]>(subscriber => {
      const targetSessionId = sessionId || this.currentSessionId$.value;

      if (!targetSessionId) {
        subscriber.next([]);
        return;
      }

      // 返回该会话的消息
      const messages = this.messagesMap.get(targetSessionId) || [];
      subscriber.next(messages);
    });
  }

  /**
   * 获取指定会话的消息当前值
   * @param sessionId 会话 ID（可选，默认当前会话）
   * @returns 消息列表
   */
  getMessagesValue(sessionId?: string): ChatMessage[] {
    const targetSessionId = sessionId || this.currentSessionId$.value;
    if (!targetSessionId) {
      return [];
    }
    return this.messagesMap.get(targetSessionId) || [];
  }

  /**
   * 设置会话的消息
   * @param sessionId 会话 ID
   * @param messages 消息列表
   */
  setMessages(sessionId: string, messages: ChatMessage[]): void {
    this.messagesMap.set(sessionId, messages);
    this.messages$.next(new Map(this.messagesMap));
  }

  /**
   * 添加消息到会话
   * @param sessionId 会话 ID
   * @param message 消息
   */
  addMessage(sessionId: string, message: ChatMessage): void {
    const currentMessages = this.messagesMap.get(sessionId) || [];
    this.messagesMap.set(sessionId, [...currentMessages, message]);
    this.messages$.next(new Map(this.messagesMap));
  }

  /**
   * 更新会话的最后一条消息
   * @param sessionId 会话 ID
   * @param content 新内容
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
   * 清空会话消息
   * @param sessionId 会话 ID
   */
  clearMessages(sessionId: string): void {
    this.messagesMap.delete(sessionId);
    this.messages$.next(new Map(this.messagesMap));
  }

  /* ==================== Streaming State ==================== */

  /**
   * 设置流式状态
   * @param streaming 是否正在流式传输
   */
  setStreamingState(streaming: boolean): void {
    this.isStreaming$.next(streaming);
  }

  /**
   * 获取流式状态
   * @returns 流式状态 Observable
   */
  getStreamingState(): Observable<boolean> {
    return this.isStreaming$.asObservable();
  }

  /**
   * 获取流式状态的当前值
   * @returns 是否正在流式传输
   */
  getStreamingStateValue(): boolean {
    return this.isStreaming$.value;
  }

  /* ==================== Tool Calls State ==================== */

  /**
   * 设置当前工具调用
   * @param toolCalls 工具调用 Map
   */
  setCurrentToolCalls(toolCalls: Map<string, ToolCall>): void {
    this.currentToolCalls$.next(new Map(toolCalls));
  }

  /**
   * 添加或更新工具调用
   * @param toolCall 工具调用
   */
  addOrUpdateToolCall(toolCall: ToolCall): void {
    const currentToolCalls = new Map(this.currentToolCalls$.value);
    currentToolCalls.set(toolCall.id, toolCall);
    this.currentToolCalls$.next(currentToolCalls);
  }

  /**
   * 删除工具调用
   * @param toolCallId 工具调用 ID
   */
  removeToolCall(toolCallId: string): void {
    const currentToolCalls = new Map(this.currentToolCalls$.value);
    currentToolCalls.delete(toolCallId);
    this.currentToolCalls$.next(currentToolCalls);
  }

  /**
   * 清空所有工具调用
   */
  clearToolCalls(): void {
    this.currentToolCalls$.next(new Map());
  }

  /**
   * 获取工具调用状态
   * @returns 工具调用 Map Observable
   */
  getCurrentToolCalls(): Observable<Map<string, ToolCall>> {
    return this.currentToolCalls$.asObservable();
  }

  /**
   * 获取工具调用状态的当前值
   * @returns 工具调用 Map
   */
  getCurrentToolCallsValue(): Map<string, ToolCall> {
    return this.currentToolCalls$.value;
  }

  /* ==================== Error State ==================== */

  /**
   * 设置错误信息
   * @param error 错误信息
   */
  setError(error: string | null): void {
    this.error$.next(error);
  }

  /**
   * 获取错误信息
   * @returns 错误信息 Observable
   */
  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * 清除错误信息
   */
  clearError(): void {
    this.error$.next(null);
  }

  /* ==================== Panel State ==================== */

  /**
   * 设置面板状态
   * @param state 面板状态
   */
  setPanelState(state: Partial<ChatPanelState>): void {
    const currentState = this.panelState$.value;
    const newState = { ...currentState, ...state };
    this.panelState$.next(newState);
    this.savePanelState(newState);
  }

  /**
   * 获取面板状态
   * @returns 面板状态 Observable
   */
  getPanelState(): Observable<ChatPanelState> {
    return this.panelState$.asObservable();
  }

  /**
   * 获取面板状态的当前值
   * @returns 面板状态
   */
  getPanelStateValue(): ChatPanelState {
    return this.panelState$.value;
  }

  /**
   * 打开面板
   */
  openPanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({ ...currentState, isOpen: true });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * 关闭面板
   */
  closePanel(): void {
    const currentState = this.panelState$.value;
    this.panelState$.next({ ...currentState, isOpen: false });
    this.savePanelState(this.panelState$.value);
  }

  /**
   * 最大化面板
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
   * 最小化面板
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
   * 恢复面板（从最大化或最小化）
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
   * 更新面板位置
   * @param position 位置信息
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
   * 更新面板大小
   * @param width 宽度
   * @param height 高度
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
   * 保存面板状态到 localStorage
   * @param state 面板状态
   */
  private savePanelState(state: ChatPanelState): void {
    try {
      localStorage.setItem('ai-chat-panel-state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save panel state:', e);
    }
  }

  /**
   * 从 localStorage 加载面板状态
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
   * 设置会话 UI 状态
   * @param sessionId 会话 ID
   * @param uiState UI 状态
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
   * 获取会话 UI 状态
   * @param sessionId 会话 ID
   * @returns UI 状态 Observable
   */
  getSessionUIState(sessionId: string): Observable<SessionUIState | undefined> {
    return new Observable<SessionUIState | undefined>(subscriber => {
      subscriber.next(this.sessionUIStateMap.get(sessionId));
    });
  }

  /**
   * 获取会话 UI 状态的当前值
   * @param sessionId 会话 ID
   * @returns UI 状态
   */
  getSessionUIStateValue(sessionId: string): SessionUIState | undefined {
    return this.sessionUIStateMap.get(sessionId);
  }

  /* ==================== Reset & Clear ==================== */

  /**
   * 重置所有状态
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
   * 重置会话相关状态（保留面板状态）
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
