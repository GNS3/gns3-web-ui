import { EditTextActionComponent } from './edit-text-action.component';
import { describe, it, expect } from 'vitest';

describe('EditTextActionComponent', () => {
  it('should be defined', () => {
    expect(EditTextActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EditTextActionComponent.name).toBe('EditTextActionComponent');
  });
});
