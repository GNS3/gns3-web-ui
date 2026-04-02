import { describe, it, expect } from 'vitest';
import { ResourcePoolsManagementComponent } from './resource-pools-management.component';

describe('ResourcePoolsManagementComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngAfterViewInit method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).ngAfterViewInit).toBe('function');
    });

    it('should have isAllSelected method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).isAllSelected).toBe('function');
    });

    it('should have masterToggle method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).masterToggle).toBe('function');
    });

    it('should have addResourcePool method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).addResourcePool).toBe('function');
    });

    it('should have refresh method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).refresh).toBe('function');
    });

    it('should have onDelete method', () => {
      expect(typeof (ResourcePoolsManagementComponent.prototype as any).onDelete).toBe('function');
    });
  });
});
