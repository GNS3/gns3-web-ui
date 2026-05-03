import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { HelpDialogComponent } from './help-dialog.component';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Message } from '@models/message';

describe('HelpDialogComponent', () => {
  let fixture: ComponentFixture<HelpDialogComponent>;
  let component: HelpDialogComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const mockMessages: Message[] = [
    { name: 'Ctrl+C', description: 'Copy selection' },
    { name: 'Ctrl+V', description: 'Paste selection' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HelpDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('title', () => {
    it('should display title when provided', () => {
      fixture.componentRef.setInput('title', 'Keyboard Shortcuts');
      fixture.detectChanges();

      const titleEl: HTMLElement = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(titleEl.textContent).toContain('Keyboard Shortcuts');
    });
  });

  describe('messages', () => {
    it('should render all messages when provided', () => {
      fixture.componentRef.setInput('messages', mockMessages);
      fixture.detectChanges();

      const messageEls = fixture.nativeElement.querySelectorAll('.message');
      expect(messageEls.length).toBe(2);
    });

    it('should display message name and description', () => {
      fixture.componentRef.setInput('messages', mockMessages);
      fixture.detectChanges();

      const firstMessage = fixture.nativeElement.querySelector('.message');
      expect(firstMessage.textContent).toContain('Ctrl+C');
      expect(firstMessage.textContent).toContain('Copy selection');
    });

    it('should render nothing in message list when messages is empty', () => {
      fixture.componentRef.setInput('messages', []);
      fixture.detectChanges();

      const messageEls = fixture.nativeElement.querySelectorAll('.message');
      expect(messageEls.length).toBe(0);
    });
  });

  describe('close button', () => {
    it('should close dialog when close button is clicked', () => {
      fixture.detectChanges();

      const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-button]');
      closeButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });

  describe('onCloseClick', () => {
    it('should exist as a method', () => {
      expect(typeof component.onCloseClick).toBe('function');
    });

    it('should call dialogRef.close when invoked', () => {
      component.onCloseClick();
      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });
});
