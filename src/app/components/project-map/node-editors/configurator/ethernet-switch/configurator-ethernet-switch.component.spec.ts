import { ConfiguratorDialogEthernetSwitchComponent } from './configurator-ethernet-switch.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogEthernetSwitchComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogEthernetSwitchComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogEthernetSwitchComponent.name).toBe('ConfiguratorDialogEthernetSwitchComponent');
  });
});
