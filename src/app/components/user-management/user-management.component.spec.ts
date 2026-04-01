import { UserManagementComponent } from './user-management.component';
import { describe, it, expect } from 'vitest';

describe('UserManagementComponent', () => {
  it('should be defined', () => {
    expect(UserManagementComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(UserManagementComponent.name).toBe('UserManagementComponent');
  });
});
