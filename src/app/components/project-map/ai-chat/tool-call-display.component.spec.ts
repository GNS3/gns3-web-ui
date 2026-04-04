import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolCallDisplayComponent } from './tool-call-display.component';
import { ToolCall } from '@models/ai-chat.interface';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ToolCallDisplayComponent', () => {
  let fixture: ComponentFixture<ToolCallDisplayComponent>;

  const createToolCall = (overrides?: Partial<ToolCall['function']>): ToolCall => ({
    id: 'tool-1',
    type: 'function',
    function: {
      name: 'test_tool',
      arguments: '{}',
      complete: true,
      ...overrides,
    },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolCallDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolCallDisplayComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('rendering', () => {
    it('should render nothing when toolCall is undefined', () => {
      fixture.componentRef.setInput('toolCall', undefined);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-call');
      expect(el).toBeNull();
    });

    it('should render nothing when toolCall function name is empty', () => {
      fixture.componentRef.setInput('toolCall', createToolCall({ name: '' }));
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-call');
      expect(el).toBeNull();
    });

    it('should render nothing when toolCall function name is undefined', () => {
      fixture.componentRef.setInput('toolCall', createToolCall({ name: undefined as any }));
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-call');
      expect(el).toBeNull();
    });

    it('should show tool name when toolCall has function.name', () => {
      fixture.componentRef.setInput('toolCall', createToolCall({ name: 'get_device_info' }));
      fixture.detectChanges();

      const nameEl = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-name');
      expect(nameEl.textContent).toContain('get_device_info');
    });
  });

  describe('spinner display', () => {
    it('should show spinner when isReceiving is true (complete === false)', () => {
      fixture.componentRef.setInput('toolCall', createToolCall({ complete: false }));
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).not.toBeNull();
    });

    it('should show spinner when isExecuting is true', () => {
      fixture.componentRef.setInput('toolCall', createToolCall());
      fixture.componentRef.setInput('isExecuting', true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).not.toBeNull();
    });

    it('should not show spinner when neither isReceiving nor isExecuting', () => {
      fixture.componentRef.setInput('toolCall', createToolCall());
      fixture.componentRef.setInput('isExecuting', false);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeNull();
    });
  });

  describe('status text', () => {
    it('should show "Receiving parameters..." status in title when isReceiving (complete === false)', () => {
      fixture.componentRef.setInput('toolCall', createToolCall({ complete: false }));
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-call');
      expect(container.title).toContain('Receiving parameters...');
    });

    it('should show "Executing..." status in title when isExecuting but not receiving', () => {
      fixture.componentRef.setInput('toolCall', createToolCall());
      fixture.componentRef.setInput('isExecuting', true);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-call');
      expect(container.title).toContain('Executing...');
    });

    it('should show "Error" status when error input is set', () => {
      fixture.componentRef.setInput('toolCall', createToolCall());
      fixture.componentRef.setInput('error', 'Something went wrong');
      fixture.detectChanges();

      const statusEl = fixture.nativeElement.querySelector('.gns3-tool-call-display__status-text');
      expect(statusEl.textContent).toContain('Error');
    });

    it('should show "Completed" status when toolOutput exists', () => {
      fixture.componentRef.setInput('toolCall', createToolCall());
      fixture.componentRef.setInput('toolOutput', '{ "result": "success" }');
      fixture.detectChanges();

      const statusEl = fixture.nativeElement.querySelector('.gns3-tool-call-display__status-text');
      expect(statusEl.textContent).toContain('Completed');
    });

    it('should show "Completed" status by default for history messages', () => {
      fixture.componentRef.setInput('toolCall', createToolCall());
      fixture.componentRef.setInput('isHistory', true);
      fixture.detectChanges();

      const statusEl = fixture.nativeElement.querySelector('.gns3-tool-call-display__status-text');
      expect(statusEl.textContent).toContain('Completed');
    });
  });

  describe('viewDetails event', () => {
    it('should emit viewDetails event when clicked', () => {
      const toolCall = createToolCall();
      fixture.componentRef.setInput('toolCall', toolCall);

      let emittedToolCall: ToolCall | undefined;
      fixture.componentInstance.viewDetails.subscribe((tc: ToolCall) => {
        emittedToolCall = tc;
      });

      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.gns3-tool-call-display__tool-call');
      el.click();

      expect(emittedToolCall).toEqual(toolCall);
    });
  });
});
