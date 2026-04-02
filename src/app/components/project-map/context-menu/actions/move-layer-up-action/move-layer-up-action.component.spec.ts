import { describe, it, expect } from 'vitest';
import { MoveLayerUpActionComponent } from './move-layer-up-action.component';

describe('MoveLayerUpActionComponent', () => {
  describe('prototype methods', () => {
    it('should have moveLayerUp method', () => {
      expect(typeof (MoveLayerUpActionComponent.prototype as any).moveLayerUp).toBe('function');
    });
  });
});
