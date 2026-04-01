import { HttpConsoleNewTabActionComponent } from './http-console-new-tab-action.component';
import { describe, it, expect } from 'vitest';

describe('HttpConsoleNewTabActionComponent', () => {
  it('should be defined', () => {
    expect(HttpConsoleNewTabActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(HttpConsoleNewTabActionComponent.name).toBe('HttpConsoleNewTabActionComponent');
  });
});
