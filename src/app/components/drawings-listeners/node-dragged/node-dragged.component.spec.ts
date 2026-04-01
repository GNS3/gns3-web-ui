import { NodeDraggedComponent } from './node-dragged.component';
import { describe, it, expect } from 'vitest';

describe('NodeDraggedComponent', () => {
  it('should be defined', () => {
    expect(NodeDraggedComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(NodeDraggedComponent.name).toBe('NodeDraggedComponent');
  });
});
