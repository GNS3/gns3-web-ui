import { AlignHorizontallyActionComponent } from './align-horizontally.component';
import { describe, it, expect } from 'vitest';

describe('AlignHorizontallyActionComponent', () => {
  it('should be defined', () => {
    expect(AlignHorizontallyActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AlignHorizontallyActionComponent.name).toBe('AlignHorizontallyActionComponent');
  });
});
