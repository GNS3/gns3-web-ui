import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodeBlockDialogComponent, CodeBlockDialogData } from './code-block-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CodeBlockDialogComponent', () => {
  let component: CodeBlockDialogComponent;
  let fixture: ComponentFixture<CodeBlockDialogComponent>;
  let mockDialogRef: any;

  const createMockData = (overrides: Partial<CodeBlockDialogData> = {}): CodeBlockDialogData => ({
    code: '<span class="hljs-keyword">const</span> x = 1;',
    language: 'javascript',
    ...overrides,
  });

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CodeBlockDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: createMockData() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeBlockDialogComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be instance of CodeBlockDialogComponent', () => {
      expect(component).toBeInstanceOf(CodeBlockDialogComponent);
    });
  });

  describe('Dialog Data', () => {
    it('should receive code from dialog data', () => {
      expect(component.data.code).toBe('<span class="hljs-keyword">const</span> x = 1;');
    });

    it('should receive language from dialog data', () => {
      expect(component.data.language).toBe('javascript');
    });

    it('should handle data without language', () => {
      const dataWithoutLanguage = { code: 'some code' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CodeBlockDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithoutLanguage },
        ],
      }).compileComponents();

      const fixtureNoLang = TestBed.createComponent(CodeBlockDialogComponent);
      const componentNoLang = fixtureNoLang.componentInstance;

      expect(componentNoLang.data.language).toBeUndefined();
      fixtureNoLang.destroy();
    });
  });

  describe('Template Rendering', () => {
    it('should display code block in dialog content', () => {
      fixture.detectChanges();
      const preElement = fixture.nativeElement.querySelector('pre.code-block-dialog__code');
      expect(preElement).toBeTruthy();
    });

    it('should display code icon in title', () => {
      fixture.detectChanges();
      const iconElement = fixture.nativeElement.querySelector('.code-block-dialog__icon');
      expect(iconElement).toBeTruthy();
    });

    it('should display "Code Block" as title', () => {
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('.code-block-dialog__title-text');
      expect(titleElement.textContent).toContain('Code Block');
    });

    it('should display language badge when provided', () => {
      fixture.detectChanges();
      const languageElement = fixture.nativeElement.querySelector('.code-block-dialog__language');
      expect(languageElement).toBeTruthy();
      expect(languageElement.textContent).toContain('javascript');
    });

    it('should not display language badge when not provided', () => {
      const dataWithoutLanguage = { code: 'some code' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CodeBlockDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithoutLanguage },
        ],
      }).compileComponents();

      const fixtureNoLang = TestBed.createComponent(CodeBlockDialogComponent);
      fixtureNoLang.detectChanges();

      const languageElement = fixtureNoLang.nativeElement.querySelector('.code-block-dialog__language');
      expect(languageElement).toBeNull();
      fixtureNoLang.destroy();
    });

    it('should display close button', () => {
      fixture.detectChanges();
      const closeButton = fixture.nativeElement.querySelector('.code-block-dialog__close-btn');
      expect(closeButton).toBeTruthy();
    });
  });

  describe('close()', () => {
    it('should call dialogRef.close()', () => {
      component.close();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should be callable from template', () => {
      fixture.detectChanges();
      const closeButton = fixture.nativeElement.querySelector('.code-block-dialog__close-btn');

      closeButton.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
