import { describe, it, expect } from 'vitest';
import { DrawingResizedComponent } from './drawing-resized.component';

describe('DrawingResizedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (DrawingResizedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onDrawingResized method', () => {
      expect(typeof (DrawingResizedComponent.prototype as any).onDrawingResized).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (DrawingResizedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
