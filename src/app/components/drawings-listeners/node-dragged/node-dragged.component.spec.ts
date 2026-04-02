import { describe, it, expect } from 'vitest';
import { NodeDraggedComponent } from './node-dragged.component';

describe('NodeDraggedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (NodeDraggedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNodeDragged method', () => {
      expect(typeof (NodeDraggedComponent.prototype as any).onNodeDragged).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (NodeDraggedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
