import { describe, it, expect } from 'vitest';
import { ConfigEditorDialogComponent } from './config-editor.component';

describe('ConfigEditorDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfigEditorDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfigEditorDialogComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfigEditorDialogComponent.prototype as any).onCancelClick).toBe('function');
    });
  });
});
