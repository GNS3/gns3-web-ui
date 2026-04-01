import { SuspendLinkActionComponent } from './suspend-link-action.component';
import { describe, it, expect } from 'vitest';

describe('SuspendLinkActionComponent', () => {
  it('should be defined', () => {
    expect(SuspendLinkActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(SuspendLinkActionComponent.name).toBe('SuspendLinkActionComponent');
  });
});
