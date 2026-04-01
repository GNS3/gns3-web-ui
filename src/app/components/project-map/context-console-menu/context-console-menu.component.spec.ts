import { ContextConsoleMenuComponent } from './context-console-menu.component';
import { describe, it, expect } from 'vitest';

describe('ContextConsoleMenuComponent', () => {
  it('should be defined', () => {
    expect(ContextConsoleMenuComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ContextConsoleMenuComponent.name).toBe('ContextConsoleMenuComponent');
  });
});
