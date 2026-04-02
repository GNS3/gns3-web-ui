import { describe, it, expect } from 'vitest';
import { ContextMenuComponent } from './context-menu.component';

describe('ContextMenuComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have setPosition method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).setPosition).toBe('function');
    });

    it('should have openMenuForDrawing method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).openMenuForDrawing).toBe('function');
    });

    it('should have openMenuForNode method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).openMenuForNode).toBe('function');
    });

    it('should have openMenuForLabel method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).openMenuForLabel).toBe('function');
    });

    it('should have openMenuForInterfaceLabel method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).openMenuForInterfaceLabel).toBe('function');
    });

    it('should have openMenuForListOfElements method', () => {
      expect(typeof (ContextMenuComponent.prototype as any).openMenuForListOfElements).toBe('function');
    });
  });
});
