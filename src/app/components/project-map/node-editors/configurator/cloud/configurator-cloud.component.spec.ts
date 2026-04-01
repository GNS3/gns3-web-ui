import { ConfiguratorDialogCloudComponent } from './configurator-cloud.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogCloudComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogCloudComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogCloudComponent.name).toBe('ConfiguratorDialogCloudComponent');
  });
});
