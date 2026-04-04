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

  it('should transform timestamp to HH:mm:ss DD/MM/YYYY format', () => {
    // 1718465445 = 2024-06-15 14:30:45 UTC -> 23:30:45 UTC+9
    const timestamp = '1718465445';
    const result = pipe.transform(timestamp);
    expect(result).toBe('23:30:45 15/6/2024');
  });

  it('should pad single digit hours with leading zero', () => {
    // 1704443103 = 2024-01-05 08:25:03 UTC -> 16:25:03 UTC+8
    const timestamp = '1704443103';
    const result = pipe.transform(timestamp);
    expect(result).toBe('16:25:03 5/1/2024');
  });

  it('should handle midnight correctly', () => {
    // 1735689600 = 2025-01-01 00:00:00 UTC -> 08:00:00 UTC+8
    const timestamp = '1735689600';
    const result = pipe.transform(timestamp);
    expect(result).toBe('8:00:00 1/1/2025');
  });

  it('should handle afternoon time correctly', () => {
    // 1721443199 = 2024-07-20 02:39:59 UTC -> 10:39:59 UTC+8
    const timestamp = '1721443199';
    const result = pipe.transform(timestamp);
    expect(result).toBe('10:39:59 20/7/2024');
  });
});
