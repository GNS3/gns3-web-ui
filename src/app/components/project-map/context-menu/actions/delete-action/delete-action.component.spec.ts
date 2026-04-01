import { DeleteActionComponent } from './delete-action.component';
import { describe, it, expect } from 'vitest';

describe('DeleteActionComponent', () => {
  it('should be defined', () => {
    expect(DeleteActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(DeleteActionComponent.name).toBe('DeleteActionComponent');
  });
});
