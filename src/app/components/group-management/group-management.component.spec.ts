import { GroupManagementComponent } from './group-management.component';
import { describe, it, expect } from 'vitest';

describe('GroupManagementComponent', () => {
  it('should be defined', () => {
    expect(GroupManagementComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(GroupManagementComponent.name).toBe('GroupManagementComponent');
  });
});
