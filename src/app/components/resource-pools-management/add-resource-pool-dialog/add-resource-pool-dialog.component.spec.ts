import { describe, it, expect } from 'vitest';
import { AddResourcePoolDialogComponent } from './add-resource-pool-dialog.component';

describe('AddResourcePoolDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddResourcePoolDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onKeyDown method', () => {
      expect(typeof (AddResourcePoolDialogComponent.prototype as any).onKeyDown).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddResourcePoolDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (AddResourcePoolDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AddResourcePoolDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
