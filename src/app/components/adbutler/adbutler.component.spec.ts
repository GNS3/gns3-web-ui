import { AdbutlerComponent } from './adbutler.component';
import { describe, it, expect } from 'vitest';

describe('AdbutlerComponent', () => {
  it('should be defined', () => {
    expect(AdbutlerComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AdbutlerComponent.name).toBe('AdbutlerComponent');
  });
});
