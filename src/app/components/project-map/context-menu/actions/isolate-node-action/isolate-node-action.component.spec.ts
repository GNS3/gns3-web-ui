import { IsolateNodeActionComponent } from './isolate-node-action.component';
import { describe, it, expect } from 'vitest';

describe('IsolateNodeActionComponent', () => {
  it('should be defined', () => {
    expect(IsolateNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(IsolateNodeActionComponent.name).toBe('IsolateNodeActionComponent');
  });
});
