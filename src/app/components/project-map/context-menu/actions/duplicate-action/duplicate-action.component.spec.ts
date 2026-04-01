import { DuplicateActionComponent } from './duplicate-action.component';
import { describe, it, expect } from 'vitest';

describe('DuplicateActionComponent', () => {
  it('should be defined', () => {
    expect(DuplicateActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DuplicateActionComponent.name).toBe('DuplicateActionComponent');
  });
});
