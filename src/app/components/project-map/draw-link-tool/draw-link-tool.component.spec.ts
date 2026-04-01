import { DrawLinkToolComponent } from './draw-link-tool.component';
import { describe, it, expect } from 'vitest';

describe('DrawLinkToolComponent', () => {
  it('should be defined', () => {
    expect(DrawLinkToolComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DrawLinkToolComponent.name).toBe('DrawLinkToolComponent');
  });
});
