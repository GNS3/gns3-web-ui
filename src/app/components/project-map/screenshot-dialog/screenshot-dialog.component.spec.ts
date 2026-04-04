import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ScreenshotDialogComponent, Screenshot } from './screenshot-dialog.component';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ScreenshotDialogComponent', () => {
  let fixture: ComponentFixture<ScreenshotDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockToasterService: any;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ScreenshotDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScreenshotDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('setFiletype', () => {
    it('should update filetype when png is available', () => {
      fixture.componentInstance.isPngAvailable = true;
      fixture.componentInstance.setFiletype('png');
      expect(fixture.componentInstance.filetype).toBe('png');
    });

    it('should not update filetype when png is not available', () => {
      fixture.componentInstance.isPngAvailable = false;
      fixture.componentInstance.filetype = 'svg';
      fixture.componentInstance.setFiletype('png');
      expect(fixture.componentInstance.filetype).toBe('svg');
    });
  });

  describe('onAddClick', () => {
    it('should close dialog with screenshot properties when form is valid', () => {
      fixture.componentInstance.nameForm.get('screenshotName').setValue('test-screenshot');
      fixture.componentInstance.filetype = 'svg';
      fixture.componentInstance.onAddClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        name: 'test-screenshot',
        filetype: 'svg',
      } as Screenshot);
    });

    it('should not close dialog when form is invalid', () => {
      fixture.componentInstance.nameForm.get('screenshotName').setValue('');
      fixture.componentInstance.nameForm.markAllAsTouched();
      fixture.componentInstance.onAddClick();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onNoClick', () => {
    it('should close dialog without data', () => {
      fixture.componentInstance.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onKeyDown', () => {
    it('should call onAddClick when Enter key is pressed', () => {
      const mockEvent = { key: 'Enter' };
      const addClickSpy = vi.spyOn(fixture.componentInstance, 'onAddClick');
      fixture.componentInstance.onKeyDown(mockEvent);
      expect(addClickSpy).toHaveBeenCalled();
    });

    it('should not call onAddClick for non-Enter keys', () => {
      const mockEvent = { key: 'Escape' };
      const addClickSpy = vi.spyOn(fixture.componentInstance, 'onAddClick');
      fixture.componentInstance.onKeyDown(mockEvent);
      expect(addClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('Screenshot type', () => {
    it('should accept valid Screenshot objects', () => {
      const screenshot: Screenshot = { name: 'test', filetype: 'svg' };
      expect(screenshot.name).toBe('test');
      expect(screenshot.filetype).toBe('svg');
    });
  });
});
