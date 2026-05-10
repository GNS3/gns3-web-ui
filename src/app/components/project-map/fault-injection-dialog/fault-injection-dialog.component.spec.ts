import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FaultInjectionDialogComponent } from './fault-injection-dialog.component';
import { AiChatService } from '@services/ai-chat.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';

describe('FaultInjectionDialogComponent', () => {
  let fixture: ComponentFixture<FaultInjectionDialogComponent>;
  let component: FaultInjectionDialogComponent;

  let mockDialogRef: any;
  let mockAiChatService: any;
  let mockController: Controller;
  let mockProject: Project;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockAiChatService = {
      injectFault: vi.fn(),
    };

    mockController = {
      id: 'ctrl-1',
      host: 'localhost',
      port: 3080,
      protocol: 'http',
      user: 'admin',
      authToken: 'token-123',
    } as any;

    mockProject = {
      project_id: 'proj-1',
      name: 'Test Project',
    } as any;

    await TestBed.configureTestingModule({
      imports: [FaultInjectionDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController, project: mockProject } },
      ],
    }).compileComponents();

    // Override the AiChatService with mock to prevent real HTTP calls
    // The component uses inject(AiChatService), so we need to provide it
    TestBed.overrideProvider(AiChatService, { useValue: mockAiChatService });

    fixture = TestBed.createComponent(FaultInjectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have idle face state', () => {
      expect(component.faceState()).toBe('idle');
    });

    it('should default fault type to 1', () => {
      expect(component.faultType()).toBe(1);
    });

    it('should not be injecting', () => {
      expect(component.isInjecting()).toBe(false);
    });

    it('should not be completed', () => {
      expect(component.completed()).toBe(false);
    });

    it('should not show confirmation', () => {
      expect(component.showConfirm()).toBe(false);
    });

    it('should have initial inject and cancel buttons in DOM', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map((b: any) => b.textContent?.trim());
      expect(buttonTexts.some((t) => t.includes('Inject Fault'))).toBe(true);
      expect(buttonTexts.some((t) => t.includes('Cancel'))).toBe(true);
    });
  });

  describe('onInject()', () => {
    it('should show confirmation panel', () => {
      component.onInject();

      expect(component.showConfirm()).toBe(true);
    });

    it('should show confirm buttons in DOM', () => {
      component.onInject();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map((b: any) => b.textContent?.trim());
      expect(buttonTexts.some((t) => t.includes('Confirm'))).toBe(true);
      expect(buttonTexts.some((t) => t.includes('Cancel'))).toBe(true);
    });
  });

  describe('onCancelConfirm()', () => {
    it('should hide confirmation panel', () => {
      component.onInject();
      expect(component.showConfirm()).toBe(true);

      component.onCancelConfirm();
      expect(component.showConfirm()).toBe(false);
    });

    it('should show initial buttons again', () => {
      component.onInject();
      component.onCancelConfirm();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map((b: any) => b.textContent?.trim());
      expect(buttonTexts.some((t) => t.includes('Inject Fault'))).toBe(true);
    });
  });

  describe('onConfirmInject()', () => {
    it('should start injection and set face state to injecting', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);

      component.onConfirmInject();

      expect(component.isInjecting()).toBe(true);
      expect(component.faceState()).toBe('injecting');
      expect(component.showConfirm()).toBe(false);
      expect(component.displayedEvents()).toEqual([]);
    });

    it('should call injectFault with correct parameters', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);

      component.onConfirmInject();

      expect(mockAiChatService.injectFault).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        'Inject 1 network fault(s) for troubleshooting practice'
      );
    });

    it('should send correct message for 2 faults', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.faultType.set(2);

      component.onConfirmInject();

      expect(mockAiChatService.injectFault).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        'Inject 2 network fault(s) for troubleshooting practice'
      );
    });

    it('should send correct message for random faults', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.faultType.set('random');

      component.onConfirmInject();

      expect(mockAiChatService.injectFault).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        'Inject random network fault(s) for troubleshooting practice'
      );
    });

    it('should do nothing if already injecting', () => {
      mockAiChatService.injectFault.mockReturnValue(new Subject<any>());
      component.onConfirmInject();
      mockAiChatService.injectFault.mockClear();

      component.onConfirmInject();

      expect(mockAiChatService.injectFault).not.toHaveBeenCalled();
    });

    // Removed: component no longer uses ChangeDetectorRef (pure signals)
  });

  describe('SSE event handling', () => {
    let stream$: Subject<any>;

    beforeEach(() => {
      stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.onConfirmInject();
    });

    it('should skip content events', () => {
      stream$.next({ type: 'content', content: 'Analyzing topology...' });

      expect(component.currentStep()).toBe('');
      expect(component.displayedEvents().length).toBe(0);
    });

    it('should handle tool_call event', () => {
      stream$.next({
        type: 'tool_call',
        tool_call: { id: 'call-1', function: { name: 'get_nodes' } },
      });

      expect(component.currentStep()).toBe('Preparing: get_nodes');
      expect(component.displayedEvents().length).toBe(1);
      expect(component.displayedEvents()[0].message).toBe('Preparing: get_nodes');
      // No cdrSpy - component uses pure signals now
    });

    it('should handle tool_start event', () => {
      stream$.next({
        type: 'tool_start',
        tool_name: 'shutdown_interface',
        tool_call_id: 'call-1',
      });

      expect(component.currentStep()).toBe('Executing: shutdown_interface');
      expect(component.displayedEvents().length).toBe(1);
      expect(component.displayedEvents()[0].message).toBe('Executing: shutdown_interface');
      // No cdrSpy - component uses pure signals now
    });

    it('should handle tool_end event', () => {
      stream$.next({
        type: 'tool_end',
        tool_name: 'shutdown_interface',
        tool_output: 'Interface Fa0/0 disabled',
        tool_call_id: 'call-1',
      });

      expect(component.displayedEvents().length).toBe(1);
      expect(component.displayedEvents()[0].message).toBe('Completed: shutdown_interface');
      // No cdrSpy - component uses pure signals now
    });

    it('should handle done event with success state', () => {
      stream$.next({ type: 'done' });

      expect(component.completed()).toBe(true);
      expect(component.isInjecting()).toBe(false);
      expect(component.faceState()).toBe('success');
      expect(component.completionStatus()).toBe('success');
      expect(component.completionTitle()).toBe('Fault injected successfully!');
      // No cdrSpy - component uses pure signals now
    });

    it('should handle error event', () => {
      stream$.next({ type: 'error', error: 'Something went wrong' });

      expect(component.completed()).toBe(true);
      expect(component.isInjecting()).toBe(false);
      expect(component.faceState()).toBe('error');
      expect(component.completionStatus()).toBe('error');
      expect(component.completionTitle()).toBe('Failed to inject fault');
      // No cdrSpy - component uses pure signals now
    });

    it('should handle content, tool_call, tool_start, tool_end sequence', () => {
      stream$.next({ type: 'content', content: 'Analysing...' });
      stream$.next({ type: 'tool_call', tool_call: { id: 'c1', function: { name: 'get_nodes' } } });
      stream$.next({ type: 'tool_start', tool_name: 'get_nodes', tool_call_id: 'c1' });
      stream$.next({ type: 'tool_end', tool_name: 'get_nodes', tool_output: '3 nodes', tool_call_id: 'c1' });
      stream$.next({ type: 'done' });

      expect(component.completed()).toBe(true);
      expect(component.faceState()).toBe('success');
      expect(component.displayedEvents().length).toBe(3); // tool_call, tool_start, tool_end
    });

    it('should ignore heartbeat events', () => {
      stream$.next({ type: 'heartbeat' });

      expect(component.displayedEvents().length).toBe(0);
    });
  });

  describe('error handling from service', () => {
    it('should handle observable error from injectFault', async () => {
      vi.useFakeTimers();

      const error = { error: { message: 'Network error' } };
      mockAiChatService.injectFault.mockReturnValue(
        new (await import('rxjs')).Observable((observer: any) => {
          observer.error(error);
        })
      );

      component.onConfirmInject();
      await vi.runAllTimersAsync();

      expect(component.completed()).toBe(true);
      expect(component.faceState()).toBe('error');
      expect(component.completionStatus()).toBe('error');
      expect(component.completionTitle()).toBe('Failed to inject fault');

      vi.useRealTimers();
    });
  });

  describe('onAbort()', () => {
    it('should set aborted state', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.onConfirmInject();

      component.onAbort();

      expect(component.isInjecting()).toBe(false);
      expect(component.completed()).toBe(true);
      expect(component.faceState()).toBe('aborted');
      expect(component.completionStatus()).toBe('aborted');
      expect(component.completionTitle()).toBe('Fault injection aborted');
    });

    it('should add abort event', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.onConfirmInject();

      component.onAbort();

      expect(component.displayedEvents().length).toBe(1);
      expect(component.displayedEvents()[0].message).toBe('Fault injection aborted by user');
    });
  });

  describe('onViewDetails()', () => {
    it('should close dialog with openAIChat=true when success', () => {
      component.completionStatus.set('success');

      component.onViewDetails();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        openAIChat: true,
      });
    });

    it('should close dialog with openAIChat=true when error', () => {
      component.completionStatus.set('error');

      component.onViewDetails();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: false,
        openAIChat: true,
      });
    });
  });

  describe('onClose()', () => {
    it('should close dialog with success=true when status is success', () => {
      component.completionStatus.set('success');

      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        events: [],
      });
    });

    it('should close dialog with success=false when status is error', () => {
      component.completionStatus.set('error');

      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: false,
        events: [],
      });
    });
  });

  describe('onCancel()', () => {
    it('should close dialog with null', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should not close dialog if injecting', () => {
      component.isInjecting.set(true);

      component.onCancel();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('getEventIcon()', () => {
    it('should return correct icon for each event type', () => {
      expect(component.getEventIcon('info')).toBe('info');
      expect(component.getEventIcon('tool_call')).toBe('build');
      expect(component.getEventIcon('success')).toBe('check_circle');
      expect(component.getEventIcon('error')).toBe('error');
      expect(component.getEventIcon('unknown')).toBe('info');
    });
  });

  describe('face state transitions', () => {
    it('should transition from idle to injecting on confirm', () => {
      mockAiChatService.injectFault.mockReturnValue(new Subject<any>());

      expect(component.faceState()).toBe('idle');

      component.onConfirmInject();
      expect(component.faceState()).toBe('injecting');
    });

    it('should transition from injecting to success on done', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.onConfirmInject();

      stream$.next({ type: 'done' });

      expect(component.faceState()).toBe('success');
    });

    it('should transition from injecting to error on error', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.onConfirmInject();

      stream$.next({ type: 'error', error: 'Failed' });

      expect(component.faceState()).toBe('error');
    });

    it('should transition from injecting to aborted on abort', () => {
      const stream$ = new Subject<any>();
      mockAiChatService.injectFault.mockReturnValue(stream$);
      component.onConfirmInject();

      component.onAbort();

      expect(component.faceState()).toBe('aborted');
    });
  });
});
