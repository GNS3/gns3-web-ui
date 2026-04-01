import { SuspendNodeActionComponent } from './suspend-node-action.component';
import { describe, it, expect } from 'vitest';

describe('SuspendNodeActionComponent', () => {
  it('should be defined', () => {
    expect(SuspendNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(SuspendNodeActionComponent.name).toBe('SuspendNodeActionComponent');
  });
});
