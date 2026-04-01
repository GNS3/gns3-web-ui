import { ConsoleWrapperComponent } from './console-wrapper.component';
import { describe, it, expect } from 'vitest';

describe('ConsoleWrapperComponent', () => {
  it('should be defined', () => {
    expect(ConsoleWrapperComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConsoleWrapperComponent.name).toBe('ConsoleWrapperComponent');
  });
});
