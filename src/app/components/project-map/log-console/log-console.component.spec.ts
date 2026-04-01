import { LogConsoleComponent } from './log-console.component';
import { describe, it, expect } from 'vitest';

describe('LogConsoleComponent', () => {
  it('should be defined', () => {
    expect(LogConsoleComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(LogConsoleComponent.name).toBe('LogConsoleComponent');
  });
});
