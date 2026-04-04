import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog.component';

describe('DeleteConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<DeleteConfirmationDialogComponent>;
  let mockDialogRef: any;

  const mockDialogData = {
    templateName: 'Test Template',
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        DeleteConfirmationDialogComponent,
        MatDialogModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initial state', () => {
    it('should display delete template dialog title', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('h2[mat-dialog-title]')?.textContent).toContain('Delete template');
    });

    it('should display template name in confirmation message', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.mat-mdc-dialog-content')?.textContent).toContain('Test Template');
    });

    it('should have cancel button with "No, cancel" text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[mat-button], button[mat-raised-button]');

      expect(buttons[0].textContent).toContain('No, cancel');
    });

    it('should have delete button with "Yes, delete!" text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[mat-button], button[mat-raised-button]');

      expect(buttons[1].textContent).toContain('Yes, delete!');
    });

    it('should have templateName signal initialized from dialog data', () => {
      expect(fixture.componentInstance.templateName()).toBe('Test Template');
    });
  });

  describe('onNoClick()', () => {
    it('should close dialog with false when cancel is clicked', () => {
      fixture.componentInstance.onNoClick();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('onYesClick()', () => {
    it('should close dialog with true when delete is confirmed', () => {
      fixture.componentInstance.onYesClick();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('templateName signal', () => {
    it('should set templateName to empty string when templateName is not provided in data', () => {
      TestBed.resetTestingModule();
      const emptyData = {};
      mockDialogRef = { close: vi.fn() };

      TestBed.configureTestingModule({
        imports: [
          DeleteConfirmationDialogComponent,
          MatDialogModule,
          NoopAnimationsModule,
        ],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: emptyData },
          { provide: MatDialogRef, useValue: mockDialogRef },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DeleteConfirmationDialogComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.templateName()).toBeUndefined();
    });

    it('should display template name in confirmation message', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.mat-mdc-dialog-content')?.textContent).toContain('Test Template');
    });
  });
});
