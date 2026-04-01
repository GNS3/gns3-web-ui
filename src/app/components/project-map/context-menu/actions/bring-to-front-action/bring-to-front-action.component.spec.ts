import { BringToFrontActionComponent } from './bring-to-front-action.component';
import { describe, it, expect } from 'vitest';

describe('BringToFrontActionComponent', () => {
  it('should be defined', () => {
    expect(BringToFrontActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(BringToFrontActionComponent.name).toBe('BringToFrontActionComponent');
  });
});
