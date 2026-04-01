import { CustomAdaptersTableComponent } from './custom-adapters-table.component';
import { describe, it, expect } from 'vitest';

describe('CustomAdaptersTableComponent', () => {
  it('should be defined', () => {
    expect(CustomAdaptersTableComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CustomAdaptersTableComponent.name).toBe('CustomAdaptersTableComponent');
  });
});
