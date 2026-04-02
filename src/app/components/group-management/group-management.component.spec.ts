import { describe, it, expect } from 'vitest';
import { GroupManagementComponent } from './group-management.component';

describe('GroupManagementComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngAfterViewInit method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).ngAfterViewInit).toBe('function');
    });

    it('should have isAllSelected method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).isAllSelected).toBe('function');
    });

    it('should have masterToggle method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).masterToggle).toBe('function');
    });

    it('should have addGroup method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).addGroup).toBe('function');
    });

    it('should have refresh method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).refresh).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).onDelete).toBe('function');
    });

    it('should have openGroupDetailDialog method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).openGroupDetailDialog).toBe('function');
    });

    it('should have openGroupAiProfileDialog method', () => {
      expect(typeof (GroupManagementComponent.prototype as any).openGroupAiProfileDialog).toBe('function');
    });
  });
});
