import { describe, it, expect } from 'vitest';
import { UserManagementComponent } from './user-management.component';

describe('UserManagementComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (UserManagementComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngAfterViewInit method', () => {
      expect(typeof (UserManagementComponent.prototype as any).ngAfterViewInit).toBe('function');
    });

    it('should have refresh method', () => {
      expect(typeof (UserManagementComponent.prototype as any).refresh).toBe('function');
    });

    it('should have addUser method', () => {
      expect(typeof (UserManagementComponent.prototype as any).addUser).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (UserManagementComponent.prototype as any).onDelete).toBe('function');
    });

    it('should have isAllSelected method', () => {
      expect(typeof (UserManagementComponent.prototype as any).isAllSelected).toBe('function');
    });

    it('should have masterToggle method', () => {
      expect(typeof (UserManagementComponent.prototype as any).masterToggle).toBe('function');
    });

    it('should have deleteMultiple method', () => {
      expect(typeof (UserManagementComponent.prototype as any).deleteMultiple).toBe('function');
    });

    it('should have openUserDetailDialog method', () => {
      expect(typeof (UserManagementComponent.prototype as any).openUserDetailDialog).toBe('function');
    });

    it('should have openAiProfileDialog method', () => {
      expect(typeof (UserManagementComponent.prototype as any).openAiProfileDialog).toBe('function');
    });
  });
});
