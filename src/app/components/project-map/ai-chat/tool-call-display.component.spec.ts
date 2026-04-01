import { ToolCallDisplayComponent } from './tool-call-display.component';
import { describe, it, expect } from 'vitest';

describe('ToolCallDisplayComponent', () => {
  it('should be defined', () => {
    expect(ToolCallDisplayComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ToolCallDisplayComponent.name).toBe('ToolCallDisplayComponent');
  });
});
