import { LockActionComponent } from './lock-action.component';
import { describe, it, expect } from 'vitest';

describe('LockActionComponent', () => {
  it('should be defined', () => {
    expect(LockActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(LockActionComponent.name).toBe('LockActionComponent');
  });
});
