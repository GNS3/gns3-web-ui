import { describe, it, expect } from 'vitest';
import { EditProjectDialogComponent } from './edit-project-dialog.component';

describe('EditProjectDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (EditProjectDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have addVariable method', () => {
      expect(typeof (EditProjectDialogComponent.prototype as any).addVariable).toBe('function');
    });

    it('should have deleteVariable method', () => {
      expect(typeof (EditProjectDialogComponent.prototype as any).deleteVariable).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (EditProjectDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (EditProjectDialogComponent.prototype as any).onYesClick).toBe('function');
    });
  });
});
