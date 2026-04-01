import { ConsoleDeviceActionBrowserComponent } from './console-device-action-browser.component';
import { describe, it, expect } from 'vitest';

describe('ConsoleDeviceActionBrowserComponent', () => {
  it('should be defined', () => {
    expect(ConsoleDeviceActionBrowserComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConsoleDeviceActionBrowserComponent.name).toBe('ConsoleDeviceActionBrowserComponent');
  });
});
