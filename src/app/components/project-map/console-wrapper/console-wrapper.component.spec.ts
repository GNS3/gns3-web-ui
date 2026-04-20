import { describe, it, expect } from 'vitest';
import { ConsoleWrapperComponent } from './console-wrapper.component';

describe('ConsoleWrapperComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngAfterViewInit method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).ngAfterViewInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have minimize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).minimize).toBe('function');
    });

    it('should have toggleMinimize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).toggleMinimize).toBe('function');
    });

    it('should have toggleMaximize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).toggleMaximize).toBe('function');
    });

    it('should have addTab method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).addTab).toBe('function');
    });

    it('should have removeTab method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).removeTab).toBe('function');
    });

    it('should have validate method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).validate).toBe('function');
    });

    it('should have onResizeEnd method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onResizeEnd).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).close).toBe('function');
    });

    it('should have getActiveTabName method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).getActiveTabName).toBe('function');
    });

    it('should have onDeviceSelected method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onDeviceSelected).toBe('function');
    });

    it('should have handleTabShortcut method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).handleTabShortcut).toBe('function');
    });

    it('should have onXtermTabShortcut method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onXtermTabShortcut).toBe('function');
    });

    it('should have onConsoleActivate method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onConsoleActivate).toBe('function');
    });

    it('should have onDocumentClick method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onDocumentClick).toBe('function');
    });

    it('should have switchToTab method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).switchToTab).toBe('function');
    });

    it('should have enableScroll method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).enableScroll).toBe('function');
    });

    it('should have disableScroll method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).disableScroll).toBe('function');
    });

    it('should have onWindowResize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onWindowResize).toBe('function');
    });
  });
});
