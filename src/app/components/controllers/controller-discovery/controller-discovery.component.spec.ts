import { ControllerDiscoveryComponent } from './controller-discovery.component';
import { describe, it, expect } from 'vitest';

describe('ControllerDiscoveryComponent', () => {
  it('should be defined', () => {
    expect(ControllerDiscoveryComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ControllerDiscoveryComponent.name).toBe('ControllerDiscoveryComponent');
  });
});
