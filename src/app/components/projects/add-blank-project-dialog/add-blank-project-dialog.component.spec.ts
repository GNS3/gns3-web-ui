import { describe, it, expect } from 'vitest';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog.component';

describe('AddBlankProjectDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddBlankProjectDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddBlankProjectDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (AddBlankProjectDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have addProject method', () => {
      expect(typeof (AddBlankProjectDialogComponent.prototype as any).addProject).toBe('function');
    });

    it('should have onKeyDown method', () => {
      expect(typeof (AddBlankProjectDialogComponent.prototype as any).onKeyDown).toBe('function');
    });

    it('should have openConfirmationDialog method', () => {
      expect(typeof (AddBlankProjectDialogComponent.prototype as any).openConfirmationDialog).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(AddBlankProjectDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
