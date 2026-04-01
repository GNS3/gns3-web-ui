import { EditLinkStyleActionComponent } from './edit-link-style-action.component';
import { describe, it, expect } from 'vitest';

describe('EditLinkStyleActionComponent', () => {
  it('should be defined', () => {
    expect(EditLinkStyleActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(EditLinkStyleActionComponent.name).toBe('EditLinkStyleActionComponent');
  });
});
