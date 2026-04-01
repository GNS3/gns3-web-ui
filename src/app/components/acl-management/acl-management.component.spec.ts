import { AclManagementComponent } from './acl-management.component';
import { describe, it, expect } from 'vitest';

describe('AclManagementComponent', () => {
  it('should be defined', () => {
    expect(AclManagementComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AclManagementComponent.name).toBe('AclManagementComponent');
  });
});
