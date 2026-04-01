import { PacketFiltersDialogComponent } from './packet-filters.component';
import { describe, it, expect } from 'vitest';

describe('PacketFiltersDialogComponent', () => {
  it('should be defined', () => {
    expect(PacketFiltersDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(PacketFiltersDialogComponent.name).toBe('PacketFiltersDialogComponent');
  });
});
