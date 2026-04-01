import { ConfiguratorDialogSwitchComponent } from './configurator-switch.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogSwitchComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogSwitchComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogSwitchComponent.name).toBe('ConfiguratorDialogSwitchComponent');
  });
});
