import { MoveLayerDownActionComponent } from './move-layer-down-action.component';
import { describe, it, expect } from 'vitest';

describe('MoveLayerDownActionComponent', () => {
  it('should be defined', () => {
    expect(MoveLayerDownActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(MoveLayerDownActionComponent.name).toBe('MoveLayerDownActionComponent');
  });
});
