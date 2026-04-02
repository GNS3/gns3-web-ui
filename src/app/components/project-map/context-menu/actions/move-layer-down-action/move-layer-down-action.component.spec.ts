import { describe, it, expect } from 'vitest';
import { MoveLayerDownActionComponent } from './move-layer-down-action.component';

describe('MoveLayerDownActionComponent', () => {
  describe('prototype methods', () => {
    it('should have moveLayerDown method', () => {
      expect(typeof (MoveLayerDownActionComponent.prototype as any).moveLayerDown).toBe('function');
    });
  });
});
