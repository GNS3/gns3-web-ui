import { NodeLabelDraggedComponent } from './node-label-dragged.component';
import { describe, it, expect } from 'vitest';

describe('NodeLabelDraggedComponent', () => {
  it('should be defined', () => {
    expect(NodeLabelDraggedComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(NodeLabelDraggedComponent.name).toBe('NodeLabelDraggedComponent');
  });
});
