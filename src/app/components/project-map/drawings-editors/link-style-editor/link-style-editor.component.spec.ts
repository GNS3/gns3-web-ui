import { describe, it, expect } from 'vitest';
import { LinkStyleEditorDialogComponent } from './link-style-editor.component';

describe('LinkStyleEditorDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (LinkStyleEditorDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have isCurvinessSelected method', () => {
      expect(typeof (LinkStyleEditorDialogComponent.prototype as any).isCurvinessSelected).toBe('function');
    });

    it('should have isFlowchartSelected method', () => {
      expect(typeof (LinkStyleEditorDialogComponent.prototype as any).isFlowchartSelected).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (LinkStyleEditorDialogComponent.prototype as any).onNoClick).toBe('function');
    });

    it('should have onYesClick method', () => {
      expect(typeof (LinkStyleEditorDialogComponent.prototype as any).onYesClick).toBe('function');
    });
  });

  describe('prototype getters', () => {
    it('should have curvinessMin getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(LinkStyleEditorDialogComponent.prototype, 'curvinessMin')?.get).toBe('function');
    });

    it('should have curvinessMax getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(LinkStyleEditorDialogComponent.prototype, 'curvinessMax')?.get).toBe('function');
    });

    it('should have curvinessStep getter', () => {
      expect(typeof Object.getOwnPropertyDescriptor(LinkStyleEditorDialogComponent.prototype, 'curvinessStep')?.get).toBe('function');
    });
  });
});
