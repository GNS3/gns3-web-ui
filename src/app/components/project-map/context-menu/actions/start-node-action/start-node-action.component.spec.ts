import { StartNodeActionComponent } from './start-node-action.component';
import { describe, it, expect } from 'vitest';

describe('StartNodeActionComponent', () => {
  it('should be defined', () => {
    expect(StartNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StartNodeActionComponent.name).toBe('StartNodeActionComponent');
  });
});
