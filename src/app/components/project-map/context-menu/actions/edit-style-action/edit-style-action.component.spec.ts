import { EditStyleActionComponent } from './edit-style-action.component';
import { describe, it, expect } from 'vitest';

describe('EditStyleActionComponent', () => {
  it('should be defined', () => {
    expect(EditStyleActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EditStyleActionComponent.name).toBe('EditStyleActionComponent');
  });
});
