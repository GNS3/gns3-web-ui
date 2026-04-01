import { ShowNodeActionComponent } from './show-node-action.component';
import { describe, it, expect } from 'vitest';

describe('ShowNodeActionComponent', () => {
  it('should be defined', () => {
    expect(ShowNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ShowNodeActionComponent.name).toBe('ShowNodeActionComponent');
  });
});
