import { MoveLayerUpActionComponent } from './move-layer-up-action.component';
import { describe, it, expect } from 'vitest';

describe('MoveLayerUpActionComponent', () => {
  it('should be defined', () => {
    expect(MoveLayerUpActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(MoveLayerUpActionComponent.name).toBe('MoveLayerUpActionComponent');
  });
});
