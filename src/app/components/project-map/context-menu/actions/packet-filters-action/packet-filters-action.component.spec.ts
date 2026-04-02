import { describe, it, expect } from 'vitest';
import { PacketFiltersActionComponent } from './packet-filters-action.component';

describe('PacketFiltersActionComponent', () => {
  describe('prototype methods', () => {
    it('should have openPacketFilters method', () => {
      expect(typeof (PacketFiltersActionComponent.prototype as any).openPacketFilters).toBe('function');
    });
  });
});
