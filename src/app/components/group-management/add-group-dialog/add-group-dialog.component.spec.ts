import { describe, it, expect } from 'vitest';
import { AddGroupDialogComponent } from './add-group-dialog.component';

describe('AddGroupDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onKeyDown method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).onKeyDown).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have selectedUser method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).selectedUser).toBe('function');
    });

    it('should have delUser method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).delUser).toBe('function');
    });

    it('should have _filter private method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any)._filter).toBe('function');
    });

    it('should have displayFn method', () => {
      expect(typeof (AddGroupDialogComponent.prototype as any).displayFn).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AddGroupDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
