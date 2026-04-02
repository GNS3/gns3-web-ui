import { describe, it, expect } from 'vitest';
import { ConsoleDeviceActionBrowserComponent } from './console-device-action-browser.component';

describe('ConsoleDeviceActionBrowserComponent', () => {
  describe('prototype methods', () => {
    it('should have openConsole method', () => {
      expect(typeof (ConsoleDeviceActionBrowserComponent.prototype as any).openConsole).toBe('function');
    });

    it('should have startConsole method', () => {
      expect(typeof (ConsoleDeviceActionBrowserComponent.prototype as any).startConsole).toBe('function');
    });
  });
});
