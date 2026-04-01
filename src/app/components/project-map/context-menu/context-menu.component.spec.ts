import { ContextMenuComponent } from './context-menu.component';
import { describe, it, expect } from 'vitest';

describe('ContextMenuComponent', () => {
  it('should be defined', () => {
    expect(ContextMenuComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ContextMenuComponent.name).toBe('ContextMenuComponent');
  });
});
