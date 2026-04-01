import { RoleManagementComponent } from './role-management.component';
import { describe, it, expect } from 'vitest';

describe('RoleManagementComponent', () => {
  it('should be defined', () => {
    expect(RoleManagementComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(RoleManagementComponent.name).toBe('RoleManagementComponent');
  });
});
