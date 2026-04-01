import { ConsoleDeviceActionComponent } from './console-device-action.component';
import { describe, it, expect } from 'vitest';

describe('ConsoleDeviceActionComponent', () => {
  it('should be defined', () => {
    expect(ConsoleDeviceActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConsoleDeviceActionComponent.name).toBe('ConsoleDeviceActionComponent');
  });
});
