import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';
import { HttpClientModule } from '@angular/common/http';
import { ChatMessageListComponent } from './chat-message-list.component';
import { ChatMessage, ToolCall, ToolResult } from '@models/ai-chat.interface';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ChatMessageListComponent', () => {
  let fixture: ComponentFixture<ChatMessageListComponent>;
  let component: ChatMessageListComponent;
  let mockDialogRef: MatDialogRef<any>;
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  const createMockMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage =>
    ({
      id: 'msg-1',
      role: 'user',
      content: 'Test message',
      created_at: new Date().toISOString(),
      ...overrides,
    }) as ChatMessage;

  const createMockToolCall = (overrides: Partial<ToolCall> = {}): ToolCall =>
    ({
      id: 'tc-1',
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: '{}',
      },
      ...overrides,
    }) as ToolCall;

  const createMockToolResult = (overrides: Partial<ToolResult> = {}): ToolResult =>
    ({
      toolName: 'test_tool',
      toolOutput: 'success',
      ...overrides,
    }) as ToolResult;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() } as any;
    mockDialog = { open: vi.fn().mockReturnValue(mockDialogRef) };

    await TestBed.configureTestingModule({
      imports: [ChatMessageListComponent, MatDialogModule, HttpClientModule, MarkdownModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(ChatMessageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('formatTime', () => {
    it('should return empty string for empty timestamp', () => {
      expect(component.formatTime('')).toBe('');
    });

    it('should return "Just now" for timestamp within 1 minute', () => {
      const recentDate = new Date(Date.now() - 30 * 1000);
      expect(component.formatTime(recentDate.toISOString())).toBe('Just now');
    });

    it('should return minutes ago for timestamp within 60 minutes', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(component.formatTime(date.toISOString())).toBe('5 minutes ago');
    });

    it('should return hours ago for timestamp within 24 hours', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(component.formatTime(date.toISOString())).toBe('3 hours ago');
    });

    it('should return formatted date for timestamp older than 24 hours', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = component.formatTime(date.toISOString());
      expect(result).toMatch(/\w+ \d{1,2}, \d{1,2}:\d{2}/);
    });

    it('should handle timestamp without timezone suffix', () => {
      const result = component.formatTime('2026-03-07T13:57:49.516000');
      expect(result).not.toBe('');
    });

    it('should return empty string for invalid timestamp', () => {
      expect(component.formatTime('invalid-date')).toBe('');
    });
  });

  describe('lastAssistantMessage', () => {
    it('should return last assistant message', () => {
      const messages = [
        createMockMessage({ id: '1', role: 'user', content: 'User msg' }),
        createMockMessage({ id: '2', role: 'assistant', content: 'First AI' }),
        createMockMessage({ id: '3', role: 'assistant', content: 'Second AI' }),
      ];
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();

      expect(component.lastAssistantMessage?.content).toBe('Second AI');
    });

    it('should return undefined when no assistant messages', () => {
      const messages = [
        createMockMessage({ id: '1', role: 'user', content: 'User msg' }),
      ];
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();

      expect(component.lastAssistantMessage).toBeUndefined();
    });
  });

  describe('trackByMessageId', () => {
    it('should return message id', () => {
      const message = createMockMessage({ id: 'msg-123' });
      expect(component.trackByMessageId(0, message)).toBe('msg-123');
    });
  });

  describe('isToolCallExecuting', () => {
    it('should return false (placeholder implementation)', () => {
      expect(component.isToolCallExecuting('tc-1')).toBe(false);
    });
  });

  describe('openToolCallDialog', () => {
    it('should open dialog with tool call data', () => {
      const toolCall = createMockToolCall({
        id: 'tc-1',
        function: { name: 'configure_router', arguments: '{"hostname":"router1"}' },
      });

      component.openToolCallDialog(toolCall);

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogCall = mockDialog.open.mock.calls[mockDialog.open.mock.calls.length - 1];
      expect(dialogCall[1]).toEqual({
        data: {
          type: 'tool_call',
          toolCall,
        },
        width: '800px',
        minWidth: '600px',
        maxWidth: '95vw',
        maxHeight: '85vh',
        panelClass: ['tool-details-dialog'],
      });
    });

    it('should open dialog when called with event and toolCall', () => {
      const toolCall = createMockToolCall({ id: 'tc-2', function: { name: 'show_routes', arguments: '{}' } });
      const event = new MouseEvent('click');

      component.openToolCallDialog(event, toolCall);

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('openAssistantToolResultDialog', () => {
    it('should open dialog with tool result data', () => {
      const toolResult = createMockToolResult({
        toolName: 'show_version',
        toolOutput: '{"ios":"15.2"}',
      });

      component.openAssistantToolResultDialog(toolResult);

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogCall = mockDialog.open.mock.calls[mockDialog.open.mock.calls.length - 1];
      expect(dialogCall[1]).toEqual({
        data: {
          type: 'tool_result',
          toolName: 'show_version',
          toolOutput: '{"ios":"15.2"}',
        },
        width: '800px',
        minWidth: '600px',
        maxWidth: '95vw',
        maxHeight: '85vh',
        panelClass: ['tool-details-dialog'],
      });
    });
  });

  describe('sendSuggestion', () => {
    it('should emit suggestionClicked with suggestion text', () => {
      let emittedValue: string | undefined;
      component.suggestionClicked.subscribe((suggestion: string) => {
        emittedValue = suggestion;
      });

      component.sendSuggestion('Explain network topology');

      expect(emittedValue).toBe('Explain network topology');
    });
  });

  describe('ngOnChanges', () => {
    it('should set shouldScrollToBottom when messages change', () => {
      const initialMessages = [createMockMessage({ id: '1', role: 'user' })];
      const newMessages = [
        ...initialMessages,
        createMockMessage({ id: '2', role: 'assistant' }),
      ];

      fixture.componentRef.setInput('messages', initialMessages);
      fixture.detectChanges();

      fixture.componentRef.setInput('messages', newMessages);
      component.ngOnChanges({
        messages: {
          previousValue: initialMessages,
          currentValue: newMessages,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect((component as any).shouldScrollToBottom).toBe(true);
    });

    it('should not set shouldScrollToBottom when messages are same', () => {
      const messages = [createMockMessage({ id: '1', role: 'user' })];

      fixture.componentRef.setInput('messages', messages);
      component.ngOnChanges({
        messages: {
          previousValue: messages,
          currentValue: messages,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect((component as any).shouldScrollToBottom).toBe(false);
    });
  });
});
