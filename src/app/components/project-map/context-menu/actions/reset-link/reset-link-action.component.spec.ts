import { ResetLinkActionComponent } from './reset-link-action.component';
import { describe, it, expect } from 'vitest';

describe('ResetLinkActionComponent', () => {
  it('should be defined', () => {
    expect(ResetLinkActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ResetLinkActionComponent.name).toBe('ResetLinkActionComponent');
  });
});
