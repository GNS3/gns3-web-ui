import { AlignVerticallyActionComponent } from './align-vertically.component';
import { describe, it, expect } from 'vitest';

describe('AlignVerticallyActionComponent', () => {
  it('should be defined', () => {
    expect(AlignVerticallyActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AlignVerticallyActionComponent.name).toBe('AlignVerticallyActionComponent');
  });
});
