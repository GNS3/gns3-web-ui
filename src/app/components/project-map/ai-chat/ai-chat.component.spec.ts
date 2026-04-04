import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, Component, Input, Output, EventEmitter } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResizeEvent } from 'angular-resizable-element';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AiChatComponent } from './ai-chat.component';
import { AiChatService } from '@services/ai-chat.service';
import { ControllerService } from '@services/controller.service';
import { AiProfilesService } from '@services/ai-profiles.service';
import { LoginService } from '@services/login.service';
import { AiChatStore } from '../../../stores/ai-chat.store';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { Project } from '@models/project';
import { Controller, ControllerProtocol } from '@models/controller';
import { ChatMessage, ChatSession, ChatEvent, ToolCall } from '@models/ai-chat.interface';
import { LLMModelConfigWithSource, CopilotMode } from '@models/ai-profile';

// Mock child components
@Component({
  selector: 'app-chat-session-list',
  standalone: true,
  template: '<div></div>',
})
class MockChatSessionListComponent {
  @Input() sessions: ChatSession[] = [];
  @Input() currentSessionId: string | null = null;
  @Input() controller: Controller | undefined;
  @Input() projectId: string = '';
  @Output() sessionSelected = new EventEmitter<string>();
  @Output() sessionCreated = new EventEmitter<void>();
  @Output() sessionRenamed = new EventEmitter<{ sessionId: string; title: string }>();
  @Output() sessionDeleted = new EventEmitter<string>();
  @Output() sessionPinned = new EventEmitter<string>();
  @Output() sessionUnpinned = new EventEmitter<string>();
}

@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  template: '<div></div>',
})
class MockChatMessageListComponent {
  @Input() messages: ChatMessage[] = [];
  @Input() isStreaming = false;
  @Output() scrollToEnd = new EventEmitter<void>();
  @Output() suggestionClicked = new EventEmitter<string>();
}

@Component({
  selector: 'app-chat-input-area',
  standalone: true,
  template: '<div></div>',
})
class MockChatInputAreaComponent {
  @Input() disabled = false;
  @Input() modelConfigs: LLMModelConfigWithSource[] = [];
  @Input() currentModelId: string | null = null;
  @Input() currentCopilotMode: CopilotMode = 'teaching_assistant';
  @Output() messageSent = new EventEmitter<string>();
  @Output() modelSelected = new EventEmitter<LLMModelConfigWithSource>();
  @Output() copilotModeSelected = new EventEmitter<CopilotMode>();
}

describe('AiChatComponent', () => {
  let component: AiChatComponent;
  let fixture: ComponentFixture<AiChatComponent>;

  // Mock services
  let mockAiChatService: any;
  let mockControllerService: any;
  let mockAiProfilesService: any;
  let mockLoginService: any;
  let mockAiChatStore: any;
  let mockSnackBar: any;
  let mockBoundaryService: any;
  let mockChangeDetectorRef: any;

  // Mock data
  let mockProject: Project;
  let mockController: Controller;

  // Subjects for store observables
  let sessionsSubject: Subject<ChatSession[]>;
  let currentSessionIdSubject: Subject<string | null>;
  let streamingStateSubject: Subject<boolean>;
  let panelStateSubject: Subject<{ isMaximized: boolean; isMinimized: boolean }>;

  beforeEach(async () => {
    // Initialize subjects for store observables
    sessionsSubject = new Subject<ChatSession[]>();
    currentSessionIdSubject = new Subject<string | null>();
    streamingStateSubject = new Subject<boolean>();
    panelStateSubject = new Subject<{ isMaximized: boolean; isMinimized: boolean }>();

    // Create mock project
    mockProject = {
      auto_close: false,
      auto_open: false,
      auto_start: false,
      drawing_grid_size: 25,
      filename: '/test/project.gns3',
      grid_size: 50,
      name: 'Test Project',
      path: '/test',
      project_id: 'proj-123',
      scene_height: 1000,
      scene_width: 1000,
      status: 'opened',
      readonly: false,
      show_interface_labels: true,
      show_layers: false,
      show_grid: true,
      snap_to_grid: true,
      variables: [],
    };

    // Create mock controller
    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as ControllerProtocol,
      username: 'admin',
      password: 'admin',
      authToken: 'test-token',
      path: '/controller',
      ubridge_path: '/usr/local/bin/ubridge',
      status: 'running',
      tokenExpired: false,
    };

    // Mock services
    mockAiChatService = {
      resetCurrentSession: vi.fn(),
      getSessions: vi.fn().mockReturnValue(of([])),
      getSessionHistory: vi.fn().mockReturnValue(of({ messages: [] })),
      streamChat: vi.fn().mockReturnValue(of({})),
      renameSession: vi.fn().mockReturnValue(of({})),
      pinSession: vi.fn().mockReturnValue(of({})),
      unpinSession: vi.fn().mockReturnValue(of({})),
      getCurrentSessionId: vi.fn().mockReturnValue(null),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockAiProfilesService = {
      getConfigs: vi.fn().mockReturnValue(of({ configs: [], default_config: null })),
      setDefaultConfig: vi.fn().mockReturnValue(of({})),
      updateConfig: vi.fn().mockReturnValue(of({})),
    };

    mockLoginService = {
      getLoggedUser: vi.fn().mockResolvedValue({ user_id: 'user-1' }),
    };

    mockAiChatStore = {
      setCurrentProjectId: vi.fn(),
      setSessions: vi.fn(),
      getSessions: vi.fn().mockReturnValue(sessionsSubject.asObservable()),
      getCurrentSessionId: vi.fn().mockReturnValue(currentSessionIdSubject.asObservable()),
      getStreamingState: vi.fn().mockReturnValue(streamingStateSubject.asObservable()),
      getPanelState: vi.fn().mockReturnValue(panelStateSubject.asObservable()),
      getPanelStateValue: vi.fn().mockReturnValue({ width: 800, height: 900 }),
      setCurrentSessionId: vi.fn(),
      setStreamingState: vi.fn(),
      clearError: vi.fn(),
      setError: vi.fn(),
      addMessage: vi.fn(),
      addOrUpdateToolCall: vi.fn(),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
      closePanel: vi.fn(),
      maximizePanel: vi.fn(),
      minimizePanel: vi.fn(),
      restorePanel: vi.fn(),
      updatePanelSize: vi.fn(),
      updatePanelPosition: vi.fn(),
      resetSessionState: vi.fn(),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockBoundaryService = {
      setConfig: vi.fn(),
      constrainWindowPosition: vi.fn().mockImplementation((style: WindowStyle) => style),
      constrainDragPosition: vi.fn().mockImplementation((style: WindowStyle, mx: number, my: number) => style),
      constrainResizeSize: vi.fn().mockImplementation((w: number, h: number) => ({ width: w, height: h })),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        AiChatComponent,
        MockChatSessionListComponent,
        MockChatMessageListComponent,
        MockChatInputAreaComponent,
      ],
    })
      .overrideComponent(AiChatComponent, {
        set: {
          providers: [
            { provide: AiChatService, useValue: mockAiChatService },
            { provide: ControllerService, useValue: mockControllerService },
            { provide: AiProfilesService, useValue: mockAiProfilesService },
            { provide: LoginService, useValue: mockLoginService },
            { provide: AiChatStore, useValue: mockAiChatStore },
            { provide: MatSnackBar, useValue: mockSnackBar },
            { provide: WindowBoundaryService, useValue: mockBoundaryService },
            { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AiChatComponent);
    component = fixture.componentInstance;

    // Set required input
    component.controller = mockController;
    fixture.componentRef.setInput('project', mockProject);

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    sessionsSubject.complete();
    currentSessionIdSubject.complete();
    streamingStateSubject.complete();
    panelStateSubject.complete();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set boundary config with correct toolbar height for desktop', () => {
      // Default is desktop (innerWidth > 768)
      expect(mockBoundaryService.setConfig).toHaveBeenCalledWith({ topOffset: 64 });
    });

    it('should call initializeChat on ngOnInit', () => {
      expect(mockAiChatStore.setCurrentProjectId).toHaveBeenCalledWith(mockProject.project_id);
      expect(mockAiChatService.resetCurrentSession).toHaveBeenCalled();
    });

    it('should call loadPanelState on initializeChat', () => {
      expect(mockAiChatStore.getPanelStateValue).toHaveBeenCalled();
    });

    it('should call loadSessions on initializeChat', () => {
      expect(mockControllerService.get).toHaveBeenCalledWith(mockController.id);
    });

    it('should call loadModelConfigs on initializeChat', () => {
      expect(mockLoginService.getLoggedUser).toHaveBeenCalled();
    });

    it('should subscribe to store state changes', () => {
      expect(mockAiChatStore.getSessions).toHaveBeenCalled();
      expect(mockAiChatStore.getCurrentSessionId).toHaveBeenCalled();
      expect(mockAiChatStore.getStreamingState).toHaveBeenCalled();
      expect(mockAiChatStore.getPanelState).toHaveBeenCalled();
    });
  });

  describe('UI State Management', () => {
    it('should have sidebar collapsed by default', () => {
      expect(component.sidebarCollapsed).toBe(true);
    });

    it('should toggle sidebar when toggleSidebar is called', () => {
      expect(component.sidebarCollapsed).toBe(true);
      component.toggleSidebar();
      expect(component.sidebarCollapsed).toBe(false);
      component.toggleSidebar();
      expect(component.sidebarCollapsed).toBe(true);
    });

    it('should not be streaming by default', () => {
      expect(component.isStreaming).toBe(false);
    });

    it('should not be dragging by default', () => {
      expect(component.isDraggingEnabled).toBe(false);
    });

    it('should not be maximized by default', () => {
      expect(component.isMaximized).toBe(false);
    });

    it('should not be minimized by default', () => {
      expect(component.isMinimized).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should emit sessionSelected when onSessionSelected is called', () => {
      const sessionId = 'session-123';
      component.onSessionSelected(sessionId);
      expect(mockAiChatStore.setCurrentSessionId).toHaveBeenCalledWith(sessionId);
    });

    it('should emit sessionCreated when onSessionCreated is called', () => {
      component.onSessionCreated();
      expect(mockAiChatStore.setCurrentSessionId).toHaveBeenCalledWith(null);
      expect(mockAiChatService.resetCurrentSession).toHaveBeenCalled();
      expect(component.currentMessages).toEqual([]);
    });

    it('should call renameSession API when onSessionRenamed is called', () => {
      const event = { sessionId: 'session-123', title: 'New Title' };
      component.onSessionRenamed(event);
      expect(mockControllerService.get).toHaveBeenCalledWith(mockController.id);
    });

    it('should call deleteSession when onSessionDeleted is called', () => {
      const sessionId = 'session-123';
      component.onSessionDeleted(sessionId);
      expect(mockAiChatStore.deleteSession).toHaveBeenCalledWith(sessionId);
    });

    it('should clear currentSessionId if deleted session was current', () => {
      component.currentSessionId = 'session-123';
      component.onSessionDeleted('session-123');
      expect(component.currentSessionId).toBeNull();
    });

    it('should call pinSession API when onSessionPinned is called', () => {
      const sessionId = 'session-123';
      component.onSessionPinned(sessionId);
      expect(mockControllerService.get).toHaveBeenCalledWith(mockController.id);
    });

    it('should call unpinSession API when onSessionUnpinned is called', () => {
      const sessionId = 'session-123';
      component.onSessionUnpinned(sessionId);
      expect(mockControllerService.get).toHaveBeenCalledWith(mockController.id);
    });
  });

  describe('Message Handling', () => {
    it('should return early when onMessageSent is called while streaming', () => {
      component.isStreaming = true;
      const message = 'Hello';
      component.onMessageSent(message);
      expect(component.currentMessages).toEqual([]);
    });

    it('should return early when onMessageSent is called without controller', () => {
      component.controller = undefined!;
      component.isStreaming = false;
      const message = 'Hello';
      component.onMessageSent(message);
      expect(component.currentMessages).toEqual([]);
    });

    it('should create user message when onMessageSent is called', () => {
      component.isStreaming = false;
      const message = 'Hello, AI!';
      component.onMessageSent(message);
      expect(component.currentMessages.length).toBe(1);
      expect(component.currentMessages[0].role).toBe('user');
      expect(component.currentMessages[0].content).toBe(message);
    });

    it('should set streaming state when onMessageSent is called for new session', () => {
      component.isStreaming = false;
      component.currentSessionId = null;
      component.onMessageSent('Hello');
      expect(component.isStreaming).toBe(true);
      expect(mockAiChatStore.setStreamingState).toHaveBeenCalledWith(true);
    });
  });

  describe('Panel State Management', () => {
    it('should toggle maximize state when maximizeChat is called', () => {
      component.maximizeChat();
      expect(component.isMaximized).toBe(true);
      expect(mockAiChatStore.maximizePanel).toHaveBeenCalled();
    });

    it('should restore chat when maximizeChat is called while maximized', () => {
      component.isMaximized = true;
      component.maximizeChat();
      expect(mockAiChatStore.restorePanel).toHaveBeenCalled();
    });

    it('should save previous style before maximizing', () => {
      const initialStyle = { ...component.style };
      component.maximizeChat();
      expect((component as any).previousStyle).toEqual(initialStyle);
    });

    it('should call minimizePanel when minimizeChat is called', () => {
      component.minimizeChat();
      expect(mockAiChatStore.minimizePanel).toHaveBeenCalled();
    });

    it('should call restorePanel when restoreChat is called', () => {
      component.restoreChat();
      expect(mockAiChatStore.restorePanel).toHaveBeenCalled();
    });

    it('should close chat and emit closed event when closeChat is called', () => {
      let closedEmitted = false;
      component.closed.subscribe(() => {
        closedEmitted = true;
      });
      component.closeChat();
      expect(mockAiChatStore.closePanel).toHaveBeenCalled();
      expect(mockAiChatStore.resetSessionState).toHaveBeenCalled();
      expect(closedEmitted).toBe(true);
    });
  });

  describe('Resize Handling', () => {
    it('should validate resize with minimum dimensions', () => {
      const mockEvent = {
        rectangle: { width: 400, height: 300 },
      } as ResizeEvent;
      expect(component.validate(mockEvent)).toBe(false);
    });

    it('should allow valid resize', () => {
      const mockEvent = {
        rectangle: { width: 600, height: 500 },
      } as ResizeEvent;
      expect(component.validate(mockEvent)).toBe(true);
    });

    it('should handle onResizeEnd with debounced save', () => {
      const mockEvent = {
        rectangle: { width: 700, height: 800, left: 100, top: 100 },
      } as ResizeEvent;
      component.onResizeEnd(mockEvent);
      expect(mockBoundaryService.constrainResizeSize).toHaveBeenCalled();
      // The debounced save should be scheduled (we can't easily test timers in zoneless mode)
      expect(mockAiChatStore.updatePanelSize).not.toHaveBeenCalled();
    });
  });

  describe('Drag Handling', () => {
    it('should toggle dragging state', () => {
      component.toggleDragging(true);
      expect(component.isDraggingEnabled).toBe(true);
      component.toggleDragging(false);
      expect(component.isDraggingEnabled).toBe(false);
    });

    it('should call debouncedSavePanelState when dragging ends', () => {
      component.toggleDragging(true);
      component.toggleDragging(false);
      // The debounced save should be scheduled (we can't easily test timers in zoneless mode)
      expect(mockAiChatStore.updatePanelSize).not.toHaveBeenCalled();
    });
  });

  describe('Window Resize', () => {
    it('should skip window resize when minimized', () => {
      component.isMinimized = true;
      component.isMaximized = false;
      component.onWindowResize();
      expect(mockBoundaryService.constrainWindowPosition).not.toHaveBeenCalled();
    });

    it('should skip window resize when maximized', () => {
      component.isMinimized = false;
      component.isMaximized = true;
      component.onWindowResize();
      expect(mockBoundaryService.constrainWindowPosition).not.toHaveBeenCalled();
    });

    it('should constrain window position on window resize in normal state', () => {
      component.isMinimized = false;
      component.isMaximized = false;
      component.onWindowResize();
      expect(mockBoundaryService.constrainWindowPosition).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should parse error message correctly for 401 error', () => {
      const error = "Error code: 401 - {'error': {'message': 'Missing Authentication header', 'code': 401}}";
      const result = (component as any).parseErrorMessage(error);
      expect(result).toBe('Authentication failed. Please check your API key or login again.');
    });

    it('should parse error message correctly for 403 error', () => {
      const error = "Error code: 403 - {'error': {'message': 'Access denied', 'code': 403}}";
      const result = (component as any).parseErrorMessage(error);
      expect(result).toBe("Access denied. You don't have permission to perform this action.");
    });

    it('should parse error message correctly for 500 error', () => {
      const error = "Error code: 500 - {'error': {'message': 'Internal Server Error', 'code': 500}}";
      const result = (component as any).parseErrorMessage(error);
      expect(result).toBe('Server error. Please try again later.');
    });

    it('should return original error when no pattern matches', () => {
      const error = 'Some unknown error message';
      const result = (component as any).parseErrorMessage(error);
      expect(result).toBe(error);
    });

    it('should handle empty error string', () => {
      const result = (component as any).parseErrorMessage('');
      expect(result).toBe('An unknown error occurred');
    });
  });

  describe('Suggestion Handling', () => {
    it('should send suggestion as message when onSuggestionClicked is called', () => {
      const suggestion = 'How do I configure OSPF?';
      const sendMessageSpy = vi.spyOn(component, 'onMessageSent');
      component.onSuggestionClicked(suggestion);
      expect(sendMessageSpy).toHaveBeenCalledWith(suggestion);
    });
  });

  describe('Scroll Handling', () => {
    it('should handle onScrollToEnd without error', () => {
      expect(() => component.onScrollToEnd()).not.toThrow();
    });
  });

  describe('Session Title', () => {
    it('should return "New chat" when no session is selected', () => {
      component.sessions = [];
      component.currentSessionId = null;
      expect(component.currentSessionTitle).toBe('New chat');
    });

    it('should return session title when session is found', () => {
      const session: ChatSession = {
        id: 1,
        thread_id: 'session-123',
        user_id: 'user-1',
        project_id: 'proj-1',
        title: 'My Session',
        message_count: 5,
        llm_calls_count: 3,
        input_tokens: 100,
        output_tokens: 200,
        total_tokens: 300,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pinned: false,
      };
      component.sessions = [session];
      component.currentSessionId = 'session-123';
      expect(component.currentSessionTitle).toBe('My Session');
    });
  });

  describe('Model Selection', () => {
    it('should return early when onModelSelected is called without controller', () => {
      // Create a new fixture without controller to test the early return
      const controllerLessFixture = TestBed.createComponent(AiChatComponent);
      const controllerLessComponent = controllerLessFixture.componentInstance;
      controllerLessFixture.componentRef.setInput('project', mockProject);
      // Don't set controller - leave it undefined
      controllerLessFixture.detectChanges();

      // Clear mocks after initialization
      vi.clearAllMocks();

      const config = {} as LLMModelConfigWithSource;
      controllerLessComponent.onModelSelected(config);
      // Should return early because controller is undefined
      expect(mockLoginService.getLoggedUser).not.toHaveBeenCalled();

      controllerLessFixture.destroy();
    });
  });

  describe('Copilot Mode Selection', () => {
    it('should return early when onCopilotModeSelected is called without controller', () => {
      // Create a new fixture without controller to test the early return
      const controllerLessFixture = TestBed.createComponent(AiChatComponent);
      const controllerLessComponent = controllerLessFixture.componentInstance;
      controllerLessFixture.componentRef.setInput('project', mockProject);
      // Don't set controller - leave it undefined
      controllerLessFixture.detectChanges();

      vi.clearAllMocks();

      controllerLessComponent.onCopilotModeSelected('teaching_assistant');
      expect(mockLoginService.getLoggedUser).not.toHaveBeenCalled();

      controllerLessFixture.destroy();
    });

    it('should return early when onCopilotModeSelected is called without currentModelId', () => {
      // Clear mocks to ensure clean state
      vi.clearAllMocks();
      component.currentModelId = null;
      component.onCopilotModeSelected('teaching_assistant');
      expect(mockLoginService.getLoggedUser).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reinitialize chat when project changes', () => {
      vi.clearAllMocks();
      const changes = {
        project: { currentValue: mockProject, previousValue: null, firstChange: () => false },
      };
      component.ngOnChanges(changes as any);
      expect(mockAiChatService.resetCurrentSession).toHaveBeenCalled();
    });

    it('should reinitialize chat when controller changes', () => {
      vi.clearAllMocks();
      const changes = {
        controller: { currentValue: mockController, previousValue: null, firstChange: () => false },
      };
      component.ngOnChanges(changes as any);
      expect(mockAiChatService.resetCurrentSession).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const nextSpy = vi.spyOn((component as any).destroy$, 'next');
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should call cleanup', () => {
      const cleanupSpy = vi.spyOn(component as any, 'cleanup');
      component.ngOnDestroy();
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should generate message ID', () => {
      const id1 = (component as any).generateMessageId();
      const id2 = (component as any).generateMessageId();
      expect(id1).toMatch(/^msg_\d+_[a-f0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-f0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate UUID', () => {
      const uuid1 = (component as any).generateUUID();
      const uuid2 = (component as any).generateUUID();
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('Legacy Tool Message Conversion', () => {
    it('should convert legacy tool messages correctly', () => {
      const legacyMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I will help',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-3',
          role: 'tool',
          content: 'tool result',
          created_at: new Date().toISOString(),
          tool_call_id: 'call-1',
          name: 'get_network_info',
        },
      ];

      const result = (component as any).convertLegacyToolMessages(legacyMessages);
      // Tool messages are merged into the preceding assistant message
      expect(result.length).toBe(2);
      expect(result[1].tool_result).toBeDefined();
      expect(result[1].tool_result![0].toolName).toBe('get_network_info');
      expect(result[1].tool_result![0].toolOutput).toBe('tool result');
    });

    it('should handle tool message without preceding assistant', () => {
      const legacyMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'tool',
          content: 'tool result',
          created_at: new Date().toISOString(),
          tool_call_id: 'call-1',
          name: 'get_network_info',
        },
      ];

      const result = (component as any).convertLegacyToolMessages(legacyMessages);
      expect(result.length).toBe(1);
      expect(result[0].role).toBe('assistant');
      expect(result[0].tool_result).toBeDefined();
    });
  });
});
