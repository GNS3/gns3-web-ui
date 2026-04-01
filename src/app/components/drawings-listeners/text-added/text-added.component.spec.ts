import { TextAddedComponent } from './text-added.component';
import { describe, it, expect } from 'vitest';

describe('TextAddedComponent', () => {
  it('should be defined', () => {
    expect(TextAddedComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(TextAddedComponent.name).toBe('TextAddedComponent');
  });
});
