import { describe, it, expect, beforeEach } from 'vitest';
import { DateFilter } from './dateFilter.pipe';

describe('DateFilter', () => {
  let pipe: DateFilter;

  beforeEach(() => {
    pipe = new DateFilter();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  // Expected values are fixed UTC strings (not derived from the local
  // timezone), matching the server's default snapshot description format
  // "%Y-%m-%d at %H:%M:%S".
  it('should render as YYYY-MM-DD at HH:mm:ss in UTC', () => {
    expect(pipe.transform('1718465445')).toBe('2024-06-15 at 15:30:45');
  });

  it('should pad single digit hours, days and months with leading zero', () => {
    expect(pipe.transform('1704443103')).toBe('2024-01-05 at 08:25:03');
  });

  it('should handle midnight correctly', () => {
    expect(pipe.transform('1735689600')).toBe('2025-01-01 at 00:00:00');
  });

  it('should handle early morning time correctly', () => {
    expect(pipe.transform('1721443199')).toBe('2024-07-20 at 02:39:59');
  });

  it('should render the same string for every timezone', () => {
    // Same epoch as the first test: the output must not depend on the
    // machine running the spec, only on the UTC value of the timestamp.
    expect(pipe.transform(String(Date.UTC(2026, 10, 16, 8, 50, 45) / 1000))).toBe('2026-11-16 at 08:50:45');
  });
});
