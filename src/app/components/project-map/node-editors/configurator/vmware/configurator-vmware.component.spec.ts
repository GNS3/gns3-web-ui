import { ConfiguratorDialogVmwareComponent } from './configurator-vmware.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogVmwareComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogVmwareComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogVmwareComponent.name).toBe('ConfiguratorDialogVmwareComponent');
  });
});
