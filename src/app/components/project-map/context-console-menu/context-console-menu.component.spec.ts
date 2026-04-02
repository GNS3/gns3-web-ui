import { describe, it, expect } from 'vitest';
import { ContextConsoleMenuComponent } from './context-console-menu.component';

describe('ContextConsoleMenuComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ContextConsoleMenuComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have setPosition method', () => {
      expect(typeof (ContextConsoleMenuComponent.prototype as any).setPosition).toBe('function');
    });

    it('should have openMenu method', () => {
      expect(typeof (ContextConsoleMenuComponent.prototype as any).openMenu).toBe('function');
    });

    it('should have openConsole method', () => {
      expect(typeof (ContextConsoleMenuComponent.prototype as any).openConsole).toBe('function');
    });

    it('should have openWebConsole method', () => {
      expect(typeof (ContextConsoleMenuComponent.prototype as any).openWebConsole).toBe('function');
    });

    it('should have openWebConsoleInNewTab method', () => {
      expect(typeof (ContextConsoleMenuComponent.prototype as any).openWebConsoleInNewTab).toBe('function');
    });
  });
});
