import { WebConsoleComponent } from './web-console.component';
import { describe, it, expect } from 'vitest';

describe('WebConsoleComponent', () => {
  it('should be defined', () => {
    expect(WebConsoleComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(WebConsoleComponent.name).toBe('WebConsoleComponent');
  });
});
