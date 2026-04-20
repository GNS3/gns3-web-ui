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
    // 1718465445 = 2024-06-15 14:30:45 UTC
    const timestamp = '1718465445';
    const date = new Date(+timestamp * 1000);
    const expected = `${date.getHours()}:${('0' + date.getMinutes()).substr(-2)}:${('0' + date.getSeconds()).substr(-2)} 15/6/2024`;
    const result = pipe.transform(timestamp);
    expect(result).toBe(expected);
  });

  it('should pad single digit hours with leading zero', () => {
    // 1704443103 = 2024-01-05 08:25:03 UTC
    const timestamp = '1704443103';
    const date = new Date(+timestamp * 1000);
    const expected = `${date.getHours()}:${('0' + date.getMinutes()).substr(-2)}:${('0' + date.getSeconds()).substr(-2)} 5/1/2024`;
    const result = pipe.transform(timestamp);
    expect(result).toBe(expected);
  });

  it('should handle midnight correctly', () => {
    // 1735689600 = 2025-01-01 00:00:00 UTC
    const timestamp = '1735689600';
    const date = new Date(+timestamp * 1000);
    const expected = `${date.getHours()}:${('0' + date.getMinutes()).substr(-2)}:${('0' + date.getSeconds()).substr(-2)} 1/1/2025`;
    const result = pipe.transform(timestamp);
    expect(result).toBe(expected);
  });

  it('should handle afternoon time correctly', () => {
    // 1721443199 = 2024-07-20 02:39:59 UTC
    const timestamp = '1721443199';
    const date = new Date(+timestamp * 1000);
    const expected = `${date.getHours()}:${('0' + date.getMinutes()).substr(-2)}:${('0' + date.getSeconds()).substr(-2)} 20/7/2024`;
    const result = pipe.transform(timestamp);
    expect(result).toBe(expected);
  });
});
