import { describe, it, expect } from 'vitest';
import { ConsoleDevicesPanelComponent } from './console-devices-panel.component';

describe('ConsoleDevicesPanelComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConsoleDevicesPanelComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (ConsoleDevicesPanelComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have isDeviceStarted method', () => {
      expect(typeof (ConsoleDevicesPanelComponent.prototype as any).isDeviceStarted).toBe('function');
    });

    it('should have onDeviceClick method', () => {
      expect(typeof (ConsoleDevicesPanelComponent.prototype as any).onDeviceClick).toBe('function');
    });

    it('should have togglePanel method', () => {
      expect(typeof (ConsoleDevicesPanelComponent.prototype as any).togglePanel).toBe('function');
    });

    it('should have getStatusLabel method', () => {
      expect(typeof (ConsoleDevicesPanelComponent.prototype as any).getStatusLabel).toBe('function');
    });
  });
});
