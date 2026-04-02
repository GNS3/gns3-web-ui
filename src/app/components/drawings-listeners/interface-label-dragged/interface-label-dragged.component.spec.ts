import { describe, it, expect } from 'vitest';
import { InterfaceLabelDraggedComponent } from './interface-label-dragged.component';

describe('InterfaceLabelDraggedComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (InterfaceLabelDraggedComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onInterfaceLabelDragged method', () => {
      expect(typeof (InterfaceLabelDraggedComponent.prototype as any).onInterfaceLabelDragged).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (InterfaceLabelDraggedComponent.prototype as any).ngOnDestroy).toBe('function');
    });
  });
});
