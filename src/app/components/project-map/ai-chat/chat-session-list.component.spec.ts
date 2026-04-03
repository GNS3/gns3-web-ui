import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AiChatService } from '@services/ai-chat.service';
import { ChatSessionListComponent } from './chat-session-list.component';
import { ChatSession } from '@models/ai-chat.interface';
import { Controller } from '@models/controller';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ChatSessionListComponent', () => {
  let component: ChatSessionListComponent;
  let fixture: ComponentFixture<ChatSessionListComponent>;
  let mockDialogRef: MatDialogRef<ConfirmationDialogComponent>;
  let mockDialog: MatDialog;
  let mockAiChatService: AiChatService;

  const mockController: Controller = {
    authToken: 'test-token',
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
  };

  const createMockSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
    id: 1,
    thread_id: 'thread-1',
    user_id: 'user-1',
    project_id: 'project-1',
    title: 'Test Session',
    message_count: 5,
    llm_calls_count: 2,
    input_tokens: 100,
    output_tokens: 200,
    total_tokens: 300,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pinned: false,
    ...overrides,
  });

  beforeEach(async () => {
    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(false)),
      close: vi.fn(),
    } as any;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    mockAiChatService = {
      deleteSession: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ChatSessionListComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: AiChatService, useValue: mockAiChatService },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(ChatSessionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('inputs', () => {
    it('should have default empty sessions', () => {
      expect(component.sessions()).toEqual([]);
    });

    it('should accept sessions input', () => {
      const sessions = [createMockSession(), createMockSession({ thread_id: 'thread-2' })];
      fixture.componentRef.setInput('sessions', sessions);
      fixture.detectChanges();
      expect(component.sessions()).toHaveLength(2);
    });

    it('should accept currentSessionId input', () => {
      fixture.componentRef.setInput('currentSessionId', 'thread-1');
      fixture.detectChanges();
      expect(component.currentSessionId()).toBe('thread-1');
    });

    it('should accept controller input', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();
      expect(component.controller()).toBe(mockController);
    });

    it('should accept projectId input', () => {
      fixture.componentRef.setInput('projectId', 'project-123');
      fixture.detectChanges();
      expect(component.projectId()).toBe('project-123');
    });
  });

  describe('outputs', () => {
    it('should emit sessionSelected when selectSession is called', () => {
      const emitSpy = vi.spyOn(component.sessionSelected, 'emit');
      component.selectSession('thread-1');
      expect(emitSpy).toHaveBeenCalledWith('thread-1');
    });

    it('should emit sessionCreated when createNewSession is called', () => {
      const emitSpy = vi.spyOn(component.sessionCreated, 'emit');
      component.createNewSession();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit sessionRenamed when finishRename is called with non-empty value', () => {
      const emitSpy = vi.spyOn(component.sessionRenamed, 'emit');
      const session = createMockSession();
      component.finishRename(session, 'New Title');
      expect(emitSpy).toHaveBeenCalledWith({ sessionId: session.thread_id, title: 'New Title' });
    });

    it('should not emit sessionRenamed when finishRename is called with empty value', () => {
      const emitSpy = vi.spyOn(component.sessionRenamed, 'emit');
      const session = createMockSession();
      component.finishRename(session, '   ');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit sessionDeleted when delete succeeds', () => {
      const emitSpy = vi.spyOn(component.sessionDeleted, 'emit');
      (mockAiChatService.deleteSession as any).mockReturnValue(of(undefined));
      const session = createMockSession();
      component.delete(session);
      expect(emitSpy).toHaveBeenCalledWith(session.thread_id);
    });

    it('should emit sessionPinned when togglePinSession is called on unpinned session', () => {
      const emitSpy = vi.spyOn(component.sessionPinned, 'emit');
      const session = createMockSession({ pinned: false });
      component.togglePinSession(session);
      expect(emitSpy).toHaveBeenCalledWith(session.thread_id);
    });

    it('should emit sessionUnpinned when togglePinSession is called on pinned session', () => {
      const emitSpy = vi.spyOn(component.sessionUnpinned, 'emit');
      const session = createMockSession({ pinned: true });
      component.togglePinSession(session);
      expect(emitSpy).toHaveBeenCalledWith(session.thread_id);
    });
  });

  describe('sortedSessions', () => {
    it('should return pinned sessions first', () => {
      const sessions = [
        createMockSession({ thread_id: 'unpinned-1', pinned: false, updated_at: '2026-04-01T10:00:00.000Z' }),
        createMockSession({ thread_id: 'pinned-1', pinned: true, updated_at: '2026-04-01T09:00:00.000Z' }),
        createMockSession({ thread_id: 'unpinned-2', pinned: false, updated_at: '2026-04-01T08:00:00.000Z' }),
        createMockSession({ thread_id: 'pinned-2', pinned: true, updated_at: '2026-04-01T07:00:00.000Z' }),
      ];
      fixture.componentRef.setInput('sessions', sessions);
      fixture.detectChanges();

      const sorted = component.sortedSessions;
      expect(sorted[0].thread_id).toBe('pinned-1');
      expect(sorted[1].thread_id).toBe('pinned-2');
      expect(sorted[2].thread_id).toBe('unpinned-1');
      expect(sorted[3].thread_id).toBe('unpinned-2');
    });

    it('should sort sessions within pinned and unpinned groups by updated_at descending', () => {
      const sessions = [
        createMockSession({ thread_id: 'old-pinned', pinned: true, updated_at: '2026-04-01T08:00:00.000Z' }),
        createMockSession({ thread_id: 'new-pinned', pinned: true, updated_at: '2026-04-01T12:00:00.000Z' }),
        createMockSession({ thread_id: 'old-unpinned', pinned: false, updated_at: '2026-04-01T06:00:00.000Z' }),
        createMockSession({ thread_id: 'new-unpinned', pinned: false, updated_at: '2026-04-01T10:00:00.000Z' }),
      ];
      fixture.componentRef.setInput('sessions', sessions);
      fixture.detectChanges();

      const sorted = component.sortedSessions;
      expect(sorted[0].thread_id).toBe('new-pinned');
      expect(sorted[1].thread_id).toBe('old-pinned');
      expect(sorted[2].thread_id).toBe('new-unpinned');
      expect(sorted[3].thread_id).toBe('old-unpinned');
    });
  });

  describe('renameSession', () => {
    it('should set editing flag on session', () => {
      const session = createMockSession();
      component.renameSession(session);
      expect((session as any).editing).toBe(true);
    });
  });

  describe('cancelRename', () => {
    it('should clear editing flag on session', () => {
      const session = createMockSession();
      (session as any).editing = true;
      component.cancelRename(session);
      expect((session as any).editing).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should open confirmation dialog', () => {
      const session = createMockSession({ title: 'Test Session' });
      component.deleteSession(session);
      expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, expect.any(Object));
    });

    it('should include session title in dialog message', () => {
      const session = createMockSession({ title: 'My Session' });
      component.deleteSession(session);
      const dialogCall = (mockDialog.open as any).mock.calls[0];
      expect(dialogCall[1].data.message).toContain('My Session');
    });

    it('should use "New chat" in message when session has no title', () => {
      const session = createMockSession({ title: '' });
      component.deleteSession(session);
      const dialogCall = (mockDialog.open as any).mock.calls[0];
      expect(dialogCall[1].data.message).toContain('New chat');
    });

    it('should delete session when dialog confirms', () => {
      (mockDialogRef.afterClosed as any).mockReturnValue(of(true));
      const session = createMockSession();
      (mockAiChatService.deleteSession as any).mockReturnValue(of(undefined));

      component.deleteSession(session);
      fixture.detectChanges();

      expect(mockAiChatService.deleteSession).toHaveBeenCalled();
    });

    it('should not delete session when dialog cancels', () => {
      (mockDialogRef.afterClosed as any).mockReturnValue(of(false));
      const session = createMockSession();

      component.deleteSession(session);
      fixture.detectChanges();

      expect(mockAiChatService.deleteSession).not.toHaveBeenCalled();
    });

    it('should calculate dialog position from click event', () => {
      const session = createMockSession();
      const event = { clientX: 500, clientY: 400 } as MouseEvent;
      component.deleteSession(session, event);

      const dialogCall = (mockDialog.open as any).mock.calls[0];
      expect(dialogCall[1].position).toBeDefined();
      expect(dialogCall[1].position.top).toBeDefined();
      expect(dialogCall[1].position.left).toBeDefined();
    });

    it('should not pass position when no event provided', () => {
      const session = createMockSession();
      component.deleteSession(session);

      const dialogCall = (mockDialog.open as any).mock.calls[0];
      expect(dialogCall[1].position).toEqual({});
    });
  });

  describe('delete', () => {
    it('should call aiChatService.deleteSession with correct parameters', () => {
      const session = createMockSession({ thread_id: 'thread-123' });
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('projectId', 'project-456');
      fixture.detectChanges();
      (mockAiChatService.deleteSession as any).mockReturnValue(of(undefined));

      component.delete(session);

      expect(mockAiChatService.deleteSession).toHaveBeenCalledWith(mockController, 'project-456', 'thread-123');
    });

    it('should emit sessionDeleted on successful deletion', () => {
      const session = createMockSession();
      const emitSpy = vi.spyOn(component.sessionDeleted, 'emit');
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('projectId', 'project-456');
      fixture.detectChanges();
      (mockAiChatService.deleteSession as any).mockReturnValue(of(undefined));

      component.delete(session);

      expect(emitSpy).toHaveBeenCalledWith(session.thread_id);
    });

    it('should handle delete error gracefully', () => {
      const session = createMockSession();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('projectId', 'project-456');
      fixture.detectChanges();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (mockAiChatService.deleteSession as any).mockReturnValue(throwError(() => new Error('Delete failed')));

      component.delete(session);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('formatTime', () => {
    it('should return empty string for empty timestamp', () => {
      expect(component.formatTime('')).toBe('');
    });

    it('should handle timestamp without timezone suffix by treating as UTC', () => {
      const timestamp = '2026-04-01T12:00:00.000000';
      const result = component.formatTime(timestamp);
      expect(result).toBeDefined();
      expect(result).not.toBe('Invalid Date');
    });

    it('should handle timestamp with timezone offset', () => {
      const timestamp = '2026-04-01T12:00:00.000+00:00';
      const result = component.formatTime(timestamp);
      expect(result).toBeDefined();
      expect(result).not.toBe('Invalid Date');
    });
  });

  describe('trackBySessionId', () => {
    it('should return thread_id as track identifier', () => {
      const session = createMockSession({ thread_id: 'track-id' });
      expect(component.trackBySessionId(0, session)).toBe('track-id');
    });
  });
});
