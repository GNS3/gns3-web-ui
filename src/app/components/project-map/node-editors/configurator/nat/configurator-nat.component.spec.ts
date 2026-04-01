import { ConfiguratorDialogNatComponent } from './configurator-nat.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogNatComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogNatComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogNatComponent.name).toBe('ConfiguratorDialogNatComponent');
  });
});
