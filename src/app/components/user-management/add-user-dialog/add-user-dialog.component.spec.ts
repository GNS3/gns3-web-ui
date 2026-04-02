import { describe, it, expect } from 'vitest';
import { AddUserDialogComponent } from './add-user-dialog.component';

describe('AddUserDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have _filter method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any)._filter).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have deleteGroup method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any).deleteGroup).toBe('function');
    });

    it('should have selectedGroup method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any).selectedGroup).toBe('function');
    });

    it('should have displayFn method', () => {
      expect(typeof (AddUserDialogComponent.prototype as any).displayFn).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AddUserDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
