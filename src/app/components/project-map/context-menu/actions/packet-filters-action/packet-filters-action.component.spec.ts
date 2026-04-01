import { PacketFiltersActionComponent } from './packet-filters-action.component';
import { describe, it, expect } from 'vitest';

describe('PacketFiltersActionComponent', () => {
  it('should be defined', () => {
    expect(PacketFiltersActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(PacketFiltersActionComponent.name).toBe('PacketFiltersActionComponent');
  });
});
