import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiChatStore } from './ai-chat.store';
import {
  ChatSession,
  ChatMessage,
  ToolCall,
  ChatPanelState,
  MessageRole,
} from '@models/ai-chat.interface';

describe('AiChatStore', () => {
  let store: AiChatStore;

  // Helper function to create mock messages
  const createMockMessage = (
    role: MessageRole,
    content: string,
    partial?: Partial<ChatMessage>
  ): ChatMessage => ({
    id: `msg-${Date.now()}-${Math.random()}`,
    role,
    content,
    created_at: new Date().toISOString(),
    ...partial,
  });

  // Helper function to create mock tool calls
  const createMockToolCall = (
    id: string,
    name: string,
    args?: Record<string, any>
  ): ToolCall => ({
    id,
    type: 'function',
    function: {
      name,
      arguments: args || {},
      complete: true,
    },
  });

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      clear: () => {
        store = {};
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    };
  })();

  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
    store = new AiChatStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /* ==================== Project & Session State ==================== */

  describe('Project State', () => {
    it('should set and get current project ID', async () => {
      const projectId$ = store.getCurrentProjectId();
      const values: string[] = [];

      projectId$.subscribe((value) => {
        if (value) values.push(value);
      });

      store.setCurrentProjectId('project-123');

      expect(store.getCurrentProjectIdValue()).toBe('project-123');
      expect(values).toEqual(['project-123']);
    });

    it('should clear messages and sessions when setting new project ID', () => {
      store.setSessions([{
        id: 1,
        thread_id: 'session-1',
        user_id: 'user-123',
        project_id: 'project-123',
        title: 'Session 1',
        message_count: 0,
        llm_calls_count: 0,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pinned: false,
      }]);
      store.setMessages('session-1', [createMockMessage('user', 'Hello')]);

      store.setCurrentProjectId('project-new');

      expect(store.getSessionsValue()).toEqual([]);
      expect(store.getMessagesValue('session-1')).toEqual([]);
    });

    it('should handle null project ID', () => {
      store.setCurrentProjectId('project-123');
      store.setCurrentProjectId(null);

      expect(store.getCurrentProjectIdValue()).toBeNull();
    });
  });

  describe('Session State', () => {
    it('should set and get current session ID', async () => {
      const sessionId$ = store.getCurrentSessionId();
      const values: (string | null)[] = [];

      sessionId$.subscribe((value) => {
        values.push(value);
      });

      store.setCurrentSessionId('session-123');

      expect(store.getCurrentSessionIdValue()).toBe('session-123');
      expect(values).toEqual([null, 'session-123']);
    });

    it('should handle null session ID', () => {
      store.setCurrentSessionId('session-123');
      store.setCurrentSessionId(null);

      expect(store.getCurrentSessionIdValue()).toBeNull();
    });
  });

  /* ==================== Sessions State ==================== */

  describe('Sessions Management', () => {
    const createMockSession = (threadId: string, title: string): ChatSession => ({
      id: 1,
      thread_id: threadId,
      user_id: 'user-123',
      project_id: 'project-123',
      title: title,
      message_count: 0,
      llm_calls_count: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pinned: false,
    });

    it('should set and get sessions', async () => {
      const sessions: ChatSession[] = [
        createMockSession('session-1', 'Session 1'),
        createMockSession('session-2', 'Session 2'),
      ];

      const sessions$ = store.getSessions();
      const values: ChatSession[][] = [];

      sessions$.subscribe((value) => {
        values.push(value);
      });

      store.setSessions(sessions);

      expect(store.getSessionsValue()).toEqual(sessions);
      expect(values[values.length - 1]).toEqual(sessions);
    });

    it('should add new session to the beginning of list', () => {
      const session1 = createMockSession('session-1', 'Session 1');
      const session2 = createMockSession('session-2', 'Session 2');

      store.setSessions([session1]);
      store.addSession(session2);

      const sessions = store.getSessionsValue();
      expect(sessions).toHaveLength(2);
      expect(sessions[0]).toEqual(session2);
      expect(sessions[1]).toEqual(session1);
    });

    it('should update existing session', () => {
      const session1 = createMockSession('session-1', 'Session 1');
      const session2 = createMockSession('session-2', 'Session 2');

      store.setSessions([session1, session2]);

      const updatedSession = { ...session1, title: 'Updated Session 1' };
      store.updateSession(updatedSession);

      const sessions = store.getSessionsValue();
      expect(sessions).toHaveLength(2);
      expect(sessions[0]).toEqual(updatedSession);
      expect(sessions[1]).toEqual(session2);
    });

    it('should not update if session does not exist', () => {
      const session1 = createMockSession('session-1', 'Session 1');

      store.setSessions([session1]);

      const newSession = createMockSession('session-999', 'New Session');
      store.updateSession(newSession);

      const sessions = store.getSessionsValue();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual(session1);
    });

    it('should delete session and its messages', () => {
      const session1 = createMockSession('session-1', 'Session 1');
      const session2 = createMockSession('session-2', 'Session 2');

      store.setSessions([session1, session2]);
      store.setMessages('session-1', [createMockMessage('user', 'Hello')]);

      store.deleteSession('session-1');

      expect(store.getSessionsValue()).toEqual([session2]);
      expect(store.getMessagesValue('session-1')).toEqual([]);
    });

    it('should reset current session when deleting current session', () => {
      const session1 = createMockSession('session-1', 'Session 1');

      store.setSessions([session1]);
      store.setCurrentSessionId('session-1');
      store.deleteSession('session-1');

      expect(store.getCurrentSessionIdValue()).toBeNull();
    });

    it('should not reset current session when deleting other session', () => {
      const session1 = createMockSession('session-1', 'Session 1');
      const session2 = createMockSession('session-2', 'Session 2');

      store.setSessions([session1, session2]);
      store.setCurrentSessionId('session-1');
      store.deleteSession('session-2');

      expect(store.getCurrentSessionIdValue()).toBe('session-1');
    });
  });

  /* ==================== Messages State ==================== */

  describe('Messages Management', () => {
    it('should set and get messages for session', async () => {
      const messages: ChatMessage[] = [
        createMockMessage('user', 'Hello'),
        createMockMessage('assistant', 'Hi there!'),
      ];

      store.setMessages('session-1', messages);

      expect(store.getMessagesValue('session-1')).toEqual(messages);
    });

    it('should get messages observable for specific session', async () => {
      const messages: ChatMessage[] = [createMockMessage('user', 'Hello')];

      store.setMessages('session-1', messages);

      const messages$ = store.getMessages('session-1');
      const result = await new Promise<ChatMessage[]>((resolve) => {
        messages$.subscribe((value) => {
          resolve(value);
        });
      });

      expect(result).toEqual(messages);
    });

    it('should return empty array when no session ID provided', async () => {
      const messages$ = store.getMessages();
      const result = await new Promise<ChatMessage[]>((resolve) => {
        messages$.subscribe((value) => {
          resolve(value);
        });
      });

      expect(result).toEqual([]);
    });

    it('should add message to session', () => {
      const message1 = createMockMessage('user', 'Hello');
      const message2 = createMockMessage('assistant', 'Hi!');

      store.setMessages('session-1', [message1]);
      store.addMessage('session-1', message2);

      const messages = store.getMessagesValue('session-1');
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(message1);
      expect(messages[1]).toEqual(message2);
    });

    it('should update last message content', () => {
      const message1 = createMockMessage('user', 'Hello');
      const message2 = createMockMessage('assistant', 'Hi');

      store.setMessages('session-1', [message1, message2]);
      store.updateLastMessage('session-1', ' there!');

      const messages = store.getMessagesValue('session-1');
      expect(messages).toHaveLength(2);
      expect(messages[1].content).toBe('Hi there!');
    });

    it('should not update last message when no messages exist', () => {
      store.updateLastMessage('session-1', 'content');

      const messages = store.getMessagesValue('session-1');
      expect(messages).toEqual([]);
    });

    it('should clear messages for session', () => {
      store.setMessages('session-1', [createMockMessage('user', 'Hello')]);
      store.clearMessages('session-1');

      expect(store.getMessagesValue('session-1')).toEqual([]);
    });

    it('should maintain separate messages for different sessions', () => {
      const message1 = createMockMessage('user', 'Session 1');
      const message2 = createMockMessage('user', 'Session 2');

      store.setMessages('session-1', [message1]);
      store.setMessages('session-2', [message2]);

      expect(store.getMessagesValue('session-1')).toEqual([message1]);
      expect(store.getMessagesValue('session-2')).toEqual([message2]);
    });
  });

  /* ==================== Streaming State ==================== */

  describe('Streaming State', () => {
    it('should set and get streaming state', async () => {
      const streaming$ = store.getStreamingState();
      const values: boolean[] = [];

      streaming$.subscribe((value) => {
        values.push(value);
      });

      expect(store.getStreamingStateValue()).toBe(false);

      store.setStreamingState(true);

      expect(store.getStreamingStateValue()).toBe(true);
      expect(values).toEqual([false, true]);
    });
  });

  /* ==================== Tool Calls State ==================== */

  describe('Tool Calls Management', () => {
    it('should set and get tool calls', async () => {
      const toolCall1 = createMockToolCall('tool-1', 'search', {});
      const toolCall2 = createMockToolCall('tool-2', 'calculate', {});

      const toolCallsMap = new Map<string, ToolCall>();
      toolCallsMap.set('tool-1', toolCall1);
      toolCallsMap.set('tool-2', toolCall2);

      store.setCurrentToolCalls(toolCallsMap);

      expect(store.getCurrentToolCallsValue().size).toBe(2);
      expect(store.getCurrentToolCallsValue().get('tool-1')).toEqual(toolCall1);
    });

    it('should add new tool call', () => {
      const toolCall = createMockToolCall('tool-1', 'search', {});

      store.addOrUpdateToolCall(toolCall);

      expect(store.getCurrentToolCallsValue().size).toBe(1);
      expect(store.getCurrentToolCallsValue().get('tool-1')).toEqual(toolCall);
    });

    it('should update existing tool call', () => {
      const toolCall1 = createMockToolCall('tool-1', 'search', {});
      const toolCall2 = createMockToolCall('tool-1', 'search', { query: 'test' });

      store.addOrUpdateToolCall(toolCall1);
      store.addOrUpdateToolCall(toolCall2);

      expect(store.getCurrentToolCallsValue().size).toBe(1);
      expect(store.getCurrentToolCallsValue().get('tool-1')).toEqual(toolCall2);
    });

    it('should remove tool call', () => {
      const toolCall = createMockToolCall('tool-1', 'search', {});

      store.addOrUpdateToolCall(toolCall);
      expect(store.getCurrentToolCallsValue().size).toBe(1);

      store.removeToolCall('tool-1');
      expect(store.getCurrentToolCallsValue().size).toBe(0);
    });

    it('should clear all tool calls', () => {
      const toolCall1 = createMockToolCall('tool-1', 'search', {});
      const toolCall2 = createMockToolCall('tool-2', 'calculate', {});

      store.addOrUpdateToolCall(toolCall1);
      store.addOrUpdateToolCall(toolCall2);

      expect(store.getCurrentToolCallsValue().size).toBe(2);

      store.clearToolCalls();
      expect(store.getCurrentToolCallsValue().size).toBe(0);
    });
  });

  /* ==================== Error State ==================== */

  describe('Error State', () => {
    it('should set and get error', async () => {
      const error$ = store.getError();
      const values: (string | null)[] = [];

      error$.subscribe((value) => {
        values.push(value);
      });

      store.setError('Test error');

      const result = await new Promise<string | null>((resolve) => {
        error$.subscribe((value) => {
          resolve(value);
        });
      });

      expect(result).toBe('Test error');
      expect(values).toContain('Test error');
    });

    it('should clear error', async () => {
      store.setError('Test error');
      store.clearError();

      const result = await new Promise<string | null>((resolve) => {
        store.getError().subscribe((value) => {
          resolve(value);
        });
      });

      expect(result).toBeNull();
    });
  });

  /* ==================== Panel State ==================== */

  describe('Panel State Management', () => {
    it('should get default panel state', () => {
      const state = store.getPanelStateValue();

      expect(state.isOpen).toBe(false);
      expect(state.width).toBe(800);
      expect(state.height).toBe(900);
      expect(state.isMaximized).toBe(false);
      expect(state.isMinimized).toBe(false);
      expect(state.position).toEqual({ top: 80, right: 20 });
    });

    it('should set panel state', async () => {
      const panelState$ = store.getPanelState();
      const values: ChatPanelState[] = [];

      panelState$.subscribe((value) => {
        values.push(value);
      });

      store.setPanelState({ isOpen: true, width: 1000 });

      const state = store.getPanelStateValue();
      expect(state.isOpen).toBe(true);
      expect(state.width).toBe(1000);
      expect(values.length).toBeGreaterThan(1);
    });

    it('should open panel', () => {
      store.openPanel();

      expect(store.getPanelStateValue().isOpen).toBe(true);
    });

    it('should close panel', () => {
      store.openPanel();
      store.closePanel();

      expect(store.getPanelStateValue().isOpen).toBe(false);
    });

    it('should maximize panel', () => {
      store.maximizePanel();

      const state = store.getPanelStateValue();
      expect(state.isMaximized).toBe(true);
      expect(state.isMinimized).toBe(false);
    });

    it('should minimize panel', () => {
      store.minimizePanel();

      const state = store.getPanelStateValue();
      expect(state.isMaximized).toBe(false);
      expect(state.isMinimized).toBe(true);
    });

    it('should restore panel', () => {
      store.maximizePanel();
      store.restorePanel();

      const state = store.getPanelStateValue();
      expect(state.isMaximized).toBe(false);
      expect(state.isMinimized).toBe(false);
    });

    it('should update panel position', () => {
      store.updatePanelPosition({ top: 100, left: 50 });

      const state = store.getPanelStateValue();
      expect(state.position).toEqual({ top: 100, right: 20, left: 50 });
    });

    it('should update panel size', () => {
      store.updatePanelSize(1200, 1000);

      const state = store.getPanelStateValue();
      expect(state.width).toBe(1200);
      expect(state.height).toBe(1000);
    });

    it('should save panel state to localStorage', () => {
      store.setPanelState({ isOpen: true, width: 1000 });

      const saved = localStorageMock.getItem('ai-chat-panel-state');
      expect(saved).toBeTruthy();

      const state = JSON.parse(saved!);
      expect(state.isOpen).toBe(true);
      expect(state.width).toBe(1000);
    });

    it('should load panel state from localStorage', () => {
      const savedState: ChatPanelState = {
        isOpen: true,
        width: 1200,
        height: 1100,
        isMaximized: false,
        isMinimized: false,
        position: { top: 100, right: 30 },
      };

      localStorageMock.setItem('ai-chat-panel-state', JSON.stringify(savedState));

      const newStore = new AiChatStore();
      const state = newStore.getPanelStateValue();

      // isOpen should be reset to false on load
      expect(state.isOpen).toBe(false);
      expect(state.width).toBe(1200);
      expect(state.height).toBe(1100);
      expect(state.position).toEqual({ top: 100, right: 30 });
    });

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => store.setPanelState({ isOpen: true })).not.toThrow();
    });
  });

  /* ==================== Session UI State ==================== */

  describe('Session UI State', () => {
    it('should set and get session UI state', async () => {
      store.setSessionUIState('session-1', { isEditing: true, isExpanded: false });

      const state = await new Promise((resolve) => {
        store.getSessionUIState('session-1').subscribe((value) => {
          resolve(value);
        });
      });

      expect(state).toEqual({ isEditing: true, isExpanded: false });
    });

    it('should get session UI state value', () => {
      store.setSessionUIState('session-1', { isEditing: true });

      const state = store.getSessionUIStateValue('session-1');
      expect(state).toEqual({ isEditing: true, isExpanded: true });
    });

    it('should return default state when session not found', () => {
      const state = store.getSessionUIStateValue('non-existent');
      expect(state).toBeUndefined();
    });

    it('should merge UI state updates', () => {
      store.setSessionUIState('session-1', { isEditing: true });
      store.setSessionUIState('session-1', { isExpanded: false });

      const state = store.getSessionUIStateValue('session-1');
      expect(state).toEqual({ isEditing: true, isExpanded: false });
    });

    it('should maintain separate UI states for different sessions', () => {
      store.setSessionUIState('session-1', { isEditing: true });
      store.setSessionUIState('session-2', { isEditing: false });

      expect(store.getSessionUIStateValue('session-1')).toEqual({ isEditing: true, isExpanded: true });
      expect(store.getSessionUIStateValue('session-2')).toEqual({ isEditing: false, isExpanded: true });
    });
  });

  /* ==================== Reset & Clear ==================== */

  describe('Reset Operations', () => {
    it('should reset all state', () => {
      // Setup some state
      store.setCurrentProjectId('project-123');
      store.setCurrentSessionId('session-123');
      store.setSessions([{
        id: 1,
        thread_id: 'session-1',
        user_id: 'user-123',
        project_id: 'project-123',
        title: 'Session 1',
        message_count: 0,
        llm_calls_count: 0,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pinned: false,
      }]);
      store.setMessages('session-1', [createMockMessage('user', 'Hello')]);
      store.setStreamingState(true);
      store.addOrUpdateToolCall(createMockToolCall('tool-1', 'search', {}));
      store.setError('Test error');
      store.setSessionUIState('session-1', { isEditing: true });

      // Reset all
      store.resetAll();

      // Verify all state is reset
      expect(store.getCurrentProjectIdValue()).toBeNull();
      expect(store.getCurrentSessionIdValue()).toBeNull();
      expect(store.getSessionsValue()).toEqual([]);
      expect(store.getMessagesValue('session-1')).toEqual([]);
      expect(store.getStreamingStateValue()).toBe(false);
      expect(store.getCurrentToolCallsValue().size).toBe(0);
      expect(store.getSessionUIStateValue('session-1')).toBeUndefined();
    });

    it('should reset session state only', () => {
      // Setup state
      store.setCurrentSessionId('session-123');
      store.setMessages('session-123', [createMockMessage('user', 'Hello')]);
      store.setStreamingState(true);
      store.addOrUpdateToolCall(createMockToolCall('tool-1', 'search', {}));
      store.setError('Test error');

      // Set panel state (should not be reset)
      store.openPanel();

      // Reset session state
      store.resetSessionState();

      // Verify session state is reset
      expect(store.getCurrentSessionIdValue()).toBeNull();
      expect(store.getMessagesValue('session-123')).toEqual([]);
      expect(store.getStreamingStateValue()).toBe(false);
      expect(store.getCurrentToolCallsValue().size).toBe(0);

      // Verify panel state is preserved
      expect(store.getPanelStateValue().isOpen).toBe(true);
    });
  });

  /* ==================== Edge Cases ==================== */

  describe('Edge Cases', () => {
    it('should handle empty messages when getting messages for non-existent session', () => {
      expect(store.getMessagesValue('non-existent')).toEqual([]);
    });

    it('should handle adding message to new session', () => {
      const message = createMockMessage('user', 'Hello');

      store.addMessage('new-session', message);

      expect(store.getMessagesValue('new-session')).toEqual([message]);
    });

    it('should handle multiple rapid state updates', () => {
      for (let i = 0; i < 100; i++) {
        store.setStreamingState(i % 2 === 0);
      }

      expect(store.getStreamingStateValue()).toBe(false);
    });
  });
});
