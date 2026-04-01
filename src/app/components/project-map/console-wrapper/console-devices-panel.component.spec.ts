import { ConsoleDevicesPanelComponent } from './console-devices-panel.component';
import { describe, it, expect } from 'vitest';

describe('ConsoleDevicesPanelComponent', () => {
  it('should be defined', () => {
    expect(ConsoleDevicesPanelComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConsoleDevicesPanelComponent.name).toBe('ConsoleDevicesPanelComponent');
  });
});
