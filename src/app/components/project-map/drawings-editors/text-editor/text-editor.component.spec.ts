import { describe, it, expect } from 'vitest';
import { TextEditorDialogComponent, StyleProperty } from './text-editor.component';

describe('TextEditorDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TextEditorDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getTextElementFromLabel method', () => {
      expect(typeof (TextEditorDialogComponent.prototype as any).getTextElementFromLabel).toBe('function');
    });

    it('should have getStyleFromTextElement method', () => {
      expect(typeof (TextEditorDialogComponent.prototype as any).getStyleFromTextElement).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (TextEditorDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (TextEditorDialogComponent.prototype as any).onYesClick).toBe('function');
    });

    it('should have changeTextColor method', () => {
      expect(typeof (TextEditorDialogComponent.prototype as any).changeTextColor).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export StyleProperty interface', () => {
      const styleProperty: StyleProperty = { property: 'color', value: '#000' };
      expect(styleProperty.property).toBe('color');
      expect(styleProperty.value).toBe('#000');
    });
  });
});
