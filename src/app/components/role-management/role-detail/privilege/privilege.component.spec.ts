import { describe, it, expect } from 'vitest';
import { PrivilegeComponent } from './privilege.component';

describe('PrivilegeComponent', () => {
  describe('prototype methods', () => {
    it('should have toggleCollapsed method', () => {
      expect(typeof (PrivilegeComponent.prototype as any).toggleCollapsed).toBe('function');
    });

    it('should have onPrivilegeChange method', () => {
      expect(typeof (PrivilegeComponent.prototype as any).onPrivilegeChange).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof (PrivilegeComponent.prototype as any).close).toBe('function');
    });
  });

  describe('prototype getters/setters', () => {
    it('should have editMode getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(PrivilegeComponent.prototype, 'editMode')?.get).toBe('function');
    });

    it('should have editMode setter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(PrivilegeComponent.prototype, 'editMode')?.set).toBe('function');
    });

    it('should have collapsed getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(PrivilegeComponent.prototype, 'collapsed')?.get).toBe('function');
    });
  });
});
