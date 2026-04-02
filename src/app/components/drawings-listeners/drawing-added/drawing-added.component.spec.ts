import { describe, it, expect } from 'vitest';
import { DrawingAddedComponent } from './drawing-added.component';

describe('DrawingAddedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (DrawingAddedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnChanges method', () => {
      expect(typeof (DrawingAddedComponent.prototype as any).ngOnChanges).toBe('function');
    });

    it('should have onDrawingSaved method', () => {
      expect(typeof (DrawingAddedComponent.prototype as any).onDrawingSaved).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (DrawingAddedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
