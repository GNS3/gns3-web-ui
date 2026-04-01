import { NodesMenuComponent } from './nodes-menu.component';
import { describe, it, expect } from 'vitest';

describe('NodesMenuComponent', () => {
  it('should be defined', () => {
    expect(NodesMenuComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(NodesMenuComponent.name).toBe('NodesMenuComponent');
  });
});
