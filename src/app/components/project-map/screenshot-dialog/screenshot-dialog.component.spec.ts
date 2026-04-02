import { describe, it, expect } from 'vitest';
import { ScreenshotDialogComponent, Screenshot } from './screenshot-dialog.component';

describe('ScreenshotDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ScreenshotDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (ScreenshotDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (ScreenshotDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onKeyDown method', () => {
      expect(typeof (ScreenshotDialogComponent.prototype as any).onKeyDown).toBe('function');
    });

    it('should have setFiletype method', () => {
      expect(typeof (ScreenshotDialogComponent.prototype as any).setFiletype).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(ScreenshotDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export Screenshot class', () => {
      const screenshot: Screenshot = { name: 'test', filetype: 'svg' };
      expect(screenshot.name).toBe('test');
      expect(screenshot.filetype).toBe('svg');
    });
  });
});
