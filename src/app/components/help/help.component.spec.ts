import { HelpComponent } from './help.component';
import { describe, it, expect } from 'vitest';

describe('HelpComponent', () => {
  it('should be defined', () => {
    expect(HelpComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(HelpComponent.name).toBe('HelpComponent');
  });
});
