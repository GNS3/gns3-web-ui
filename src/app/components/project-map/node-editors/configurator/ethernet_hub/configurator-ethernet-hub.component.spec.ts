import { ConfiguratorDialogEthernetHubComponent } from './configurator-ethernet-hub.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogEthernetHubComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogEthernetHubComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogEthernetHubComponent.name).toBe('ConfiguratorDialogEthernetHubComponent');
  });
});
