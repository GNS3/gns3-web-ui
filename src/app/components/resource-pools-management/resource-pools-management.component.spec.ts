import { ResourcePoolsManagementComponent } from './resource-pools-management.component';
import { describe, it, expect } from 'vitest';

describe('ResourcePoolsManagementComponent', () => {
  it('should be defined', () => {
    expect(ResourcePoolsManagementComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ResourcePoolsManagementComponent.name).toBe('ResourcePoolsManagementComponent');
  });
});
