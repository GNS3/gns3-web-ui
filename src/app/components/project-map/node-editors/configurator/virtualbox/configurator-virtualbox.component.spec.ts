import { ConfiguratorDialogVirtualBoxComponent } from './configurator-virtualbox.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogVirtualBoxComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogVirtualBoxComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogVirtualBoxComponent.name).toBe('ConfiguratorDialogVirtualBoxComponent');
  });
});
