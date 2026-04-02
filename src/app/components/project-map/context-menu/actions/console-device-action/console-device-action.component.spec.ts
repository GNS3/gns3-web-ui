import { describe, it, expect } from 'vitest';
import { ConsoleDeviceActionComponent } from './console-device-action.component';

describe('ConsoleDeviceActionComponent', () => {
  describe('prototype methods', () => {
    it('should have console method', () => {
      expect(typeof (ConsoleDeviceActionComponent.prototype as any).console).toBe('function');
    });
  });
});
