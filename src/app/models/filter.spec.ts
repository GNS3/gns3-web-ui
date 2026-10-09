import { describe, it, expect } from 'vitest';
import { hasActiveFilters } from './filter';

describe('hasActiveFilters', () => {
  it('should return false for undefined or null filters', () => {
    expect(hasActiveFilters(undefined)).toBe(false);
    expect(hasActiveFilters(null)).toBe(false);
  });

  it('should return false for an empty filters object', () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it('should return true when at least one filter key exists', () => {
    expect(hasActiveFilters({ bpf: ['tcp port 80'] })).toBe(true);
    expect(hasActiveFilters({ frequency_drop: [-1] })).toBe(true);
    expect(hasActiveFilters({ rate: ['512kbit'] })).toBe(true);
    expect(hasActiveFilters({ window_drop: [0, 2000, 100] })).toBe(true);
  });

  it('should treat a present key as active (the server strips inactive filters on PUT)', () => {
    expect(hasActiveFilters({ bpf: [''] })).toBe(true);
  });
});
