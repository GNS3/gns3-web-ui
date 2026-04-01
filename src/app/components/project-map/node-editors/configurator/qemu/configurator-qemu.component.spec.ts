import { ConfiguratorDialogQemuComponent } from './configurator-qemu.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogQemuComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogQemuComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogQemuComponent.name).toBe('ConfiguratorDialogQemuComponent');
  });
});
