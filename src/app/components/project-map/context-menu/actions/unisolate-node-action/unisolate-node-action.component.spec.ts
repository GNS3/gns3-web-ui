import { UnisolateNodeActionComponent } from './unisolate-node-action.component';
import { describe, it, expect } from 'vitest';

describe('UnisolateNodeActionComponent', () => {
  it('should be defined', () => {
    expect(UnisolateNodeActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(UnisolateNodeActionComponent.name).toBe('UnisolateNodeActionComponent');
  });
});
