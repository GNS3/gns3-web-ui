import { StopNodeActionComponent } from './stop-node-action.component';
import { describe, it, expect } from 'vitest';

describe('StopNodeActionComponent', () => {
  it('should be defined', () => {
    expect(StopNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(StopNodeActionComponent.name).toBe('StopNodeActionComponent');
  });
});
