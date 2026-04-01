import { HttpConsoleActionComponent } from './http-console-action.component';
import { describe, it, expect } from 'vitest';

describe('HttpConsoleActionComponent', () => {
  it('should be defined', () => {
    expect(HttpConsoleActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(HttpConsoleActionComponent.name).toBe('HttpConsoleActionComponent');
  });
});
