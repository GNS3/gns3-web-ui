import { describe, it, expect } from 'vitest';
import { AddRoleDialogComponent } from './add-role-dialog.component';

describe('AddRoleDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddRoleDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddRoleDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (AddRoleDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AddRoleDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
