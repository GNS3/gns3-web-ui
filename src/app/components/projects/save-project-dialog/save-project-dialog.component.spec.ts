import { describe, it, expect } from 'vitest';
import { SaveProjectDialogComponent } from './save-project-dialog.component';

describe('SaveProjectDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (SaveProjectDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (SaveProjectDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (SaveProjectDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have addProject method', () => {
      expect(typeof (SaveProjectDialogComponent.prototype as any).addProject).toBe('function');
    });

    it('should have onKeyDown method', () => {
      expect(typeof (SaveProjectDialogComponent.prototype as any).onKeyDown).toBe('function');
    });

    it('should have form getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(SaveProjectDialogComponent.prototype, 'form')?.get).toBe('function');
    });
  });
});
