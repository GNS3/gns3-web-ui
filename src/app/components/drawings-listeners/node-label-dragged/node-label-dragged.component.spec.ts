import { describe, it, expect } from 'vitest';
import { NodeLabelDraggedComponent } from './node-label-dragged.component';

describe('NodeLabelDraggedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (NodeLabelDraggedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onNodeLabelDragged method', () => {
      expect(typeof (NodeLabelDraggedComponent.prototype as any).onNodeLabelDragged).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (NodeLabelDraggedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
