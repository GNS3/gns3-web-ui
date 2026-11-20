import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProgressDialogComponent } from './progress-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ProgressDialogComponent', () => {
  let fixture: ComponentFixture<ProgressDialogComponent>;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProgressDialogComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  const createComponent = (data?: Record<string, unknown>) => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data ?? {} });
    fixture = TestBed.createComponent(ProgressDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create the component', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('should render the custom title and message from dialog data', () => {
    createComponent({ title: 'Creating snapshot', message: "Creating snapshot 'base'." });

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('Creating snapshot');
    expect(element.querySelector('.progress-dialog__message')?.textContent).toContain(
      "Creating snapshot 'base'."
    );
  });

  it('should fall back to default texts when no data is provided', () => {
    createComponent();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('Please wait');
    expect(element.querySelector('.progress-dialog__message')?.textContent).toContain(
      'The operation is in progress…'
    );
  });

  it('should render the background hint when one is given', () => {
    createComponent({ backgroundHint: 'Snapshots cannot be cancelled once started.' });

    const hint = fixture.nativeElement.querySelector('.progress-dialog__hint');
    expect(hint?.textContent).toContain('Snapshots cannot be cancelled once started.');
  });

  it('should not render a background hint when none is given', () => {
    createComponent();

    expect(fixture.nativeElement.querySelector('.progress-dialog__hint')).toBeNull();
  });

  it('should offer continuing in the background instead of cancelling', () => {
    createComponent();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const dismiss = buttons.find((b: HTMLButtonElement) => b.textContent?.includes('Continue in background'));
    expect(dismiss).toBeTruthy();
    expect(buttons.some((b: HTMLButtonElement) => b.textContent?.trim() === 'Cancel')).toBe(false);
  });

  it('should close without a result when dismissed', () => {
    const component = createComponent();

    component.onDismissClick();

    // No result value: dismissing never signals cancellation to the caller,
    // it only hides the dialog while the server-side operation keeps running.
    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
