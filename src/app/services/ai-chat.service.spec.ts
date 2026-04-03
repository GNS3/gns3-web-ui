import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { AiChatService } from './ai-chat.service';
import { HttpController } from './http-controller.service';
import { ControllerService } from './controller.service';
import { Controller, ControllerProtocol } from '@models/controller';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ChatSession, ConversationHistory, ChatEvent, ChatErrorType } from '@models/ai-chat.interface';

describe('AiChatService', () => {
  let service: AiChatService;
  let mockHttp: HttpClient;
  let mockHttpController: HttpController;
  let mockControllerService: ControllerService;
  let mockController: Controller;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHttp = {} as HttpClient;

    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    } as any as HttpController;

    mockControllerService = {} as ControllerService;

    mockController = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as ControllerProtocol,
      authToken: 'test-token',
      tokenExpired: false,
    } as Controller;

    TestBed.configureTestingModule({
      providers: [
        AiChatService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: HttpController, useValue: mockHttpController },
        { provide: ControllerService, useValue: mockControllerService },
      ],
    });

    service = TestBed.inject(AiChatService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of AiChatService', () => {
      expect(service).toBeInstanceOf(AiChatService);
    });

    it('should be providedIn root', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getStreamingState', () => {
    it('should return an Observable', () => {
      const state$ = service.getStreamingState();
      expect(state$).toBeDefined();
    });

    it('should initially be false', async () => {
      const isStreaming = await firstValueFrom(service.getStreamingState());
      expect(isStreaming).toBe(false);
    });
  });

  describe('getCurrentSessionId', () => {
    it('should return null initially', () => {
      expect(service.getCurrentSessionId()).toBeNull();
    });

    it('should return the current session ID', () => {
      (service as any).currentSessionId = 'test-session-123';
      expect(service.getCurrentSessionId()).toBe('test-session-123');
    });
  });

  describe('resetCurrentSession', () => {
    it('should reset session and project IDs', () => {
      (service as any).currentSessionId = 'test-session';
      (service as any).currentProjectId = 'test-project';

      service.resetCurrentSession();

      expect((service as any).currentSessionId).toBeNull();
      expect((service as any).currentProjectId).toBeNull();
    });
  });

  describe('getControllerUrl', () => {
    it('should return correct URL for http protocol', () => {
      const url = (service as any).getControllerUrl(mockController);
      expect(url).toBe('http://localhost:3080');
    });

    it('should return correct URL for https protocol', () => {
      const httpsController = {
        ...mockController,
        protocol: 'https:' as ControllerProtocol,
      };
      const url = (service as any).getControllerUrl(httpsController);
      expect(url).toBe('https://localhost:3080');
    });
  });

  describe('getAuthHeaders', () => {
    it('should return Bearer token header', () => {
      const headers = (service as any).getAuthHeaders(mockController);

      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should return Basic auth header when no token', () => {
      const controllerWithoutToken = {
        ...mockController,
        authToken: '',
        username: 'user',
        password: 'pass',
      };
      const headers = (service as any).getAuthHeaders(controllerWithoutToken);

      expect(headers.get('Authorization')).toBe(`Basic ${btoa('user:pass')}`);
    });

    it('should return empty headers when no auth', () => {
      const controllerWithoutAuth = {
        ...mockController,
        authToken: '',
        username: '',
        password: '',
      };
      const headers = (service as any).getAuthHeaders(controllerWithoutAuth);

      expect(headers.get('Authorization')).toBeNull();
    });
  });

  describe('createChatError', () => {
    it('should create UNAUTHORIZED error for 401 status', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const chatError = (service as any).createChatError(error);

      expect(chatError.type).toBe(ChatErrorType.UNAUTHORIZED);
      expect(chatError.message).toBe('Unauthorized access');
    });

    it('should create SESSION_NOT_FOUND error for 404 status', () => {
      const error = { status: 404, message: 'Not found' };
      const chatError = (service as any).createChatError(error);

      expect(chatError.type).toBe(ChatErrorType.SESSION_NOT_FOUND);
      expect(chatError.message).toBe('Session not found');
    });

    it('should create NETWORK_ERROR for fetch errors', () => {
      const error = { message: 'fetch failed' };
      const chatError = (service as any).createChatError(error);

      expect(chatError.type).toBe(ChatErrorType.NETWORK_ERROR);
      expect(chatError.message).toBe('Network connection failed');
    });

    it('should create UNKNOWN_ERROR for other errors', () => {
      const error = { message: 'Some other error' };
      const chatError = (service as any).createChatError(error);

      expect(chatError.type).toBe(ChatErrorType.UNKNOWN_ERROR);
      expect(chatError.message).toBe('Some other error');
    });

    it('should handle error without message', () => {
      const error = { status: 500 };
      const chatError = (service as any).createChatError(error);

      expect(chatError.type).toBe(ChatErrorType.UNKNOWN_ERROR);
      expect(chatError.message).toBe('Unknown error');
    });
  });

  describe('getSessions', () => {
    it('should call httpController.get with correct URL', () => {
      const mockSessions: ChatSession[] = [];
      (mockHttpController.get as any).mockReturnValue(of(mockSessions));

      service.getSessions(mockController, 'project-123').subscribe();

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/chat/sessions'
      );
    });

    it('should return ChatSession array', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 1,
          thread_id: 'thread-1',
          user_id: 'user-1',
          project_id: 'project-123',
          title: 'Session 1',
          message_count: 0,
          llm_calls_count: 0,
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          last_message_at: '',
          created_at: '',
          updated_at: '',
          pinned: false,
        },
      ];
      (mockHttpController.get as any).mockReturnValue(of(mockSessions));

      const sessions = await new Promise<ChatSession[]>((resolve) => {
        service.getSessions(mockController, 'project-123').subscribe((s) => resolve(s));
      });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(1);
    });

    it('should pass through errors', () => {
      const error = new Error('Server error');
      (mockHttpController.get as any).mockReturnValue(throwError(() => error));

      service.getSessions(mockController, 'project-123').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
        },
      });
    });
  });

  describe('getSessionHistory', () => {
    it('should call httpController.get with correct URL', () => {
      (mockHttpController.get as any).mockReturnValue(of({ messages: [] }));

      service.getSessionHistory(mockController, 'project-123', 'session-456').subscribe();

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/chat/sessions/session-456/history'
      );
    });

    it('should include limit parameter when provided', () => {
      (mockHttpController.get as any).mockReturnValue(of({ messages: [] }));

      service.getSessionHistory(mockController, 'project-123', 'session-456', 50).subscribe();

      expect(mockHttpController.get).toHaveBeenCalled();
    });

    it('should return ConversationHistory', async () => {
      const mockHistory: ConversationHistory = {
        thread_id: 'session-456',
        title: 'Test Session',
        messages: [
          { id: '1', role: 'user', content: 'Hello', created_at: '' },
          { id: '2', role: 'assistant', content: 'Hi there', created_at: '' },
        ],
        llm_calls: 1,
      };
      (mockHttpController.get as any).mockReturnValue(of(mockHistory));

      const history = await new Promise<ConversationHistory>((resolve) => {
        service.getSessionHistory(mockController, 'project-123', 'session-456').subscribe((h) => resolve(h));
      });
      expect(history.messages).toHaveLength(2);
    });
  });

  describe('renameSession', () => {
    it('should call httpController.patch with correct parameters', () => {
      (mockHttpController.patch as any).mockReturnValue(of({}));

      service.renameSession(mockController, 'project-123', 'session-456', 'New Title').subscribe();

      expect(mockHttpController.patch).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/chat/sessions/session-456',
        { title: 'New Title' }
      );
    });

    it('should return updated ChatSession', async () => {
      const mockSession: ChatSession = {
        id: 456,
        thread_id: 'session-456',
        user_id: 'user-1',
        project_id: 'project-123',
        title: 'New Title',
        message_count: 1,
        llm_calls_count: 1,
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        last_message_at: '',
        created_at: '',
        updated_at: '',
        pinned: false,
      };
      (mockHttpController.patch as any).mockReturnValue(of(mockSession));

      const session = await new Promise<ChatSession>((resolve) => {
        service.renameSession(mockController, 'project-123', 'session-456', 'New Title').subscribe((s) => resolve(s));
      });
      expect(session.title).toBe('New Title');
    });
  });

  describe('deleteSession', () => {
    it('should call httpController.delete with correct URL', () => {
      (mockHttpController.delete as any).mockReturnValue(of(undefined));

      service.deleteSession(mockController, 'project-123', 'session-456').subscribe();

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/chat/sessions/session-456'
      );
    });

    it('should return void', async () => {
      (mockHttpController.delete as any).mockReturnValue(of(undefined));

      const result = await new Promise<void>((resolve) => {
        service.deleteSession(mockController, 'project-123', 'session-456').subscribe((r) => resolve(r));
      });
      expect(result).toBeUndefined();
    });
  });

  describe('pinSession', () => {
    it('should call httpController.put with correct URL', () => {
      (mockHttpController.put as any).mockReturnValue(of({}));

      service.pinSession(mockController, 'project-123', 'session-456').subscribe();

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/chat/sessions/session-456/pin',
        null
      );
    });

    it('should return updated ChatSession', async () => {
      const mockSession: ChatSession = {
        id: 456,
        thread_id: 'session-456',
        user_id: 'user-1',
        project_id: 'project-123',
        title: 'Session',
        message_count: 1,
        llm_calls_count: 1,
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        last_message_at: '',
        created_at: '',
        updated_at: '',
        pinned: true,
      };
      (mockHttpController.put as any).mockReturnValue(of(mockSession));

      const session = await new Promise<ChatSession>((resolve) => {
        service.pinSession(mockController, 'project-123', 'session-456').subscribe((s) => resolve(s));
      });
      expect(session.pinned).toBe(true);
    });
  });

  describe('unpinSession', () => {
    it('should call httpController.delete with correct URL', () => {
      (mockHttpController.delete as any).mockReturnValue(of({}));

      service.unpinSession(mockController, 'project-123', 'session-456').subscribe();

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/chat/sessions/session-456/pin'
      );
    });
  });

  describe('Internal State Management', () => {
    it('should track current project ID', () => {
      expect((service as any).currentProjectId).toBeNull();
    });

    it('should track current session ID', () => {
      expect((service as any).currentSessionId).toBeNull();
    });

    it('should have isStreaming BehaviorSubject', () => {
      expect((service as any).isStreaming).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should log errors in getSessions', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      (mockHttpController.get as any).mockReturnValue(throwError(() => error));

      service.getSessions(mockController, 'project-123').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        },
      });
    });

    it('should log errors in getSessionHistory', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      (mockHttpController.get as any).mockReturnValue(throwError(() => error));

      service.getSessionHistory(mockController, 'project-123', 'session-456').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        },
      });
    });

    it('should log errors in renameSession', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      (mockHttpController.patch as any).mockReturnValue(throwError(() => error));

      service.renameSession(mockController, 'project-123', 'session-456', 'Title').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        },
      });
    });

    it('should log errors in deleteSession', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      (mockHttpController.delete as any).mockReturnValue(throwError(() => error));

      service.deleteSession(mockController, 'project-123', 'session-456').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        },
      });
    });

    it('should log errors in pinSession', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      (mockHttpController.put as any).mockReturnValue(throwError(() => error));

      service.pinSession(mockController, 'project-123', 'session-456').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        },
      });
    });

    it('should log errors in unpinSession', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      (mockHttpController.delete as any).mockReturnValue(throwError(() => error));

      service.unpinSession(mockController, 'project-123', 'session-456').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        },
      });
    });
  });

  describe('ChatErrorType Enum Values', () => {
    it('should have correct error type values', () => {
      expect(ChatErrorType.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ChatErrorType.SESSION_NOT_FOUND).toBe('SESSION_NOT_FOUND');
      expect(ChatErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ChatErrorType.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });
});
