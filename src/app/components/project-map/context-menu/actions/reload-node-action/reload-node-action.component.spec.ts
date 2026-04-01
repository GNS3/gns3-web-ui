import { ReloadNodeActionComponent } from './reload-node-action.component';
import { describe, it, expect } from 'vitest';

describe('ReloadNodeActionComponent', () => {
  it('should be defined', () => {
    expect(ReloadNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ReloadNodeActionComponent.name).toBe('ReloadNodeActionComponent');
  });
});
