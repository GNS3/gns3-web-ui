import { describe, it, expect } from 'vitest';
import { DrawingDraggedComponent } from './drawing-dragged.component';

describe('DrawingDraggedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (DrawingDraggedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onDrawingDragged method', () => {
      expect(typeof (DrawingDraggedComponent.prototype as any).onDrawingDragged).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (DrawingDraggedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
