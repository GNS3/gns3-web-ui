import { EditNetworkConfigurationDialogComponent } from './edit-network-configuration.component';
import { describe, it, expect } from 'vitest';

describe('EditNetworkConfigurationDialogComponent', () => {
  it('should be defined', () => {
    expect(EditNetworkConfigurationDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EditNetworkConfigurationDialogComponent.name).toBe('EditNetworkConfigurationDialogComponent');
  });
});
