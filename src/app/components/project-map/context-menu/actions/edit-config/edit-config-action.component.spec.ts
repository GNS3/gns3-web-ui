import { EditConfigActionComponent } from './edit-config-action.component';
import { describe, it, expect } from 'vitest';

describe('EditConfigActionComponent', () => {
  it('should be defined', () => {
    expect(EditConfigActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EditConfigActionComponent.name).toBe('EditConfigActionComponent');
  });
});
