import { describe, it, expect } from 'vitest';
import { WebConsoleFullWindowComponent } from './web-console-full-window.component';

describe('WebConsoleFullWindowComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (WebConsoleFullWindowComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getData method', () => {
      expect(typeof (WebConsoleFullWindowComponent.prototype as any).getData).toBe('function');
    });

    it('should have openTerminal method', () => {
      expect(typeof (WebConsoleFullWindowComponent.prototype as any).openTerminal).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (WebConsoleFullWindowComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
