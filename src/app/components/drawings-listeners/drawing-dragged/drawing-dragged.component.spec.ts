import { DrawingDraggedComponent } from './drawing-dragged.component';
import { describe, it, expect } from 'vitest';

describe('DrawingDraggedComponent', () => {
  it('should be defined', () => {
    expect(DrawingDraggedComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DrawingDraggedComponent.name).toBe('DrawingDraggedComponent');
  });
});
