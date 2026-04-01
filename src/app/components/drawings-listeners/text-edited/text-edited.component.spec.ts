import { TextEditedComponent } from './text-edited.component';
import { describe, it, expect } from 'vitest';

describe('TextEditedComponent', () => {
  it('should be defined', () => {
    expect(TextEditedComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(TextEditedComponent.name).toBe('TextEditedComponent');
  });
});
