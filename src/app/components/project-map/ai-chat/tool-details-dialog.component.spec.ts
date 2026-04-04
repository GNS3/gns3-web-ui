import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ToolDetailsDialogComponent, ToolDetailsDialogData } from './tool-details-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ToolCall } from '@models/ai-chat.interface';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

describe('ToolDetailsDialogComponent', () => {
  let fixture: ComponentFixture<ToolDetailsDialogComponent>;
  let component: ToolDetailsDialogComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const mockToolCall: ToolCall = {
    id: 'call_123',
    type: 'function',
    function: {
      name: 'get_device_info',
      arguments: JSON.stringify({ device_id: 'abc123', include_config: true }),
    },
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { type: 'tool_call', toolCall: mockToolCall } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolDetailsDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Tool Call Details" title when type is tool_call', () => {
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Tool Call Details');
  });

  it('should display "Execution Result Details" title when type is tool_result', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { type: 'tool_result', toolName: 'get_device_info', toolOutput: 'result_data' },
        },
      ],
    }).compileComponents();

    const resultFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    resultFixture.detectChanges();
    const h1 = resultFixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Execution Result Details');
    resultFixture.destroy();
  });

  it('should display function name when type is tool_call', () => {
    fixture.detectChanges();
    const infoValues = fixture.nativeElement.querySelectorAll('.info-value');
    expect(infoValues[0].textContent).toContain('get_device_info');
  });

  it('should display tool name when type is tool_result', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { type: 'tool_result', toolName: 'get_device_info', toolOutput: 'result_data' },
        },
      ],
    }).compileComponents();

    const resultFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    resultFixture.detectChanges();
    const infoValues = resultFixture.nativeElement.querySelectorAll('.info-value');
    expect(infoValues[0].textContent).toContain('get_device_info');
    resultFixture.destroy();
  });

  it('should parse string arguments as JSON', () => {
    fixture.detectChanges();
    const parsed = component.parsedArguments();
    expect(parsed).toEqual({ device_id: 'abc123', include_config: true });
  });

  it('should parse tool_input string arguments as JSON', async () => {
    const toolCallWithToolInput: ToolCall = {
      id: 'call_456',
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: { tool_input: '{"param1": "value1"}' },
      },
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { type: 'tool_call', toolCall: toolCallWithToolInput } },
      ],
    }).compileComponents();

    const inputFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    inputFixture.detectChanges();
    const parsed = inputFixture.componentInstance.parsedArguments();
    expect(parsed).toEqual({ param1: 'value1' });
    inputFixture.destroy();
  });

  it('should use arguments directly when not a string or tool_input string', () => {
    const toolCallWithObjectArgs: ToolCall = {
      id: 'call_789',
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: { param1: 'value1', param2: 123 },
      },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { type: 'tool_call', toolCall: toolCallWithObjectArgs } },
      ],
    });
    TestBed.compileComponents();

    const objFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    objFixture.detectChanges();
    const parsed = objFixture.componentInstance.parsedArguments();
    expect(parsed).toEqual({ param1: 'value1', param2: 123 });
    objFixture.destroy();
  });

  it('should fallback to raw arguments when JSON parsing fails', () => {
    const toolCallWithInvalidJson: ToolCall = {
      id: 'call_invalid',
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: 'not valid json {',
      },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { type: 'tool_call', toolCall: toolCallWithInvalidJson } },
      ],
    });
    TestBed.compileComponents();

    const invalidJsonFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    invalidJsonFixture.detectChanges();
    const parsed = invalidJsonFixture.componentInstance.parsedArguments();
    expect(parsed).toBe('not valid json {');
    invalidJsonFixture.destroy();
  });

  it('should parse string output as JSON', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { type: 'tool_result', toolName: 'test_tool', toolOutput: '{"status": "success"}' },
        },
      ],
    }).compileComponents();

    const outputFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    outputFixture.detectChanges();
    const parsed = outputFixture.componentInstance.parsedOutput();
    expect(parsed).toEqual({ status: 'success' });
    outputFixture.destroy();
  });

  it('should use output directly when not a string', async () => {
    const outputObject = { status: 'success', data: [1, 2, 3] };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { type: 'tool_result', toolName: 'test_tool', toolOutput: outputObject },
        },
      ],
    }).compileComponents();

    const directOutputFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    directOutputFixture.detectChanges();
    const parsed = directOutputFixture.componentInstance.parsedOutput();
    expect(parsed).toEqual({ status: 'success', data: [1, 2, 3] });
    directOutputFixture.destroy();
  });

  it('should fallback to raw output when JSON parsing fails', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolDetailsDialogComponent, MatDialogModule, MatButtonModule, NgxJsonViewerModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { type: 'tool_result', toolName: 'test_tool', toolOutput: 'not valid json {' },
        },
      ],
    }).compileComponents();

    const invalidOutputFixture = TestBed.createComponent(ToolDetailsDialogComponent);
    invalidOutputFixture.detectChanges();
    const parsed = invalidOutputFixture.componentInstance.parsedOutput();
    expect(parsed).toBe('not valid json {');
    invalidOutputFixture.destroy();
  });

  it('should close dialog when closeDialog is called', () => {
    component.closeDialog();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog when Close button is clicked', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
