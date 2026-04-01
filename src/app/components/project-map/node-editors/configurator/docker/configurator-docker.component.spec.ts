import { ConfiguratorDialogDockerComponent } from './configurator-docker.component';
import { describe, it, expect } from 'vitest';

describe('ConfiguratorDialogDockerComponent', () => {
  it('should be defined', () => {
    expect(ConfiguratorDialogDockerComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfiguratorDialogDockerComponent.name).toBe('ConfiguratorDialogDockerComponent');
  });
});
