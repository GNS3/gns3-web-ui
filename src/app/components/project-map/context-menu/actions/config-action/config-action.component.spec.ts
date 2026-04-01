import { ConfigActionComponent } from './config-action.component';
import { describe, it, expect } from 'vitest';

describe('ConfigActionComponent', () => {
  it('should be defined', () => {
    expect(ConfigActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ConfigActionComponent.name).toBe('ConfigActionComponent');
  });
});
