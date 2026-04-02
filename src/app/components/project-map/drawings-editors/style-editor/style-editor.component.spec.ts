import { describe, it, expect } from 'vitest';
import { StyleEditorDialogComponent, ElementData } from './style-editor.component';

describe('StyleEditorDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (StyleEditorDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (StyleEditorDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (StyleEditorDialogComponent.prototype as any).onYesClick).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export ElementData class', () => {
      const elementData: ElementData = new ElementData();
      expect(elementData).toBeDefined();
    });
  });
});
