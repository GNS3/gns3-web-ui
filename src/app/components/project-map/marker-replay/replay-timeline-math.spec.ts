import { describe, it, expect } from 'vitest';
import { bucketBarWidth, formatDelta, formatFrameTime, formatSeconds, maxBucketCount } from './replay-timeline-math';
import { ReplayBucket } from '@models/marker-replay';

describe('formatSeconds / formatFrameTime', () => {
  it('formats local HH:MM:SS.ffffff — the µs fraction straight from the string', () => {
    const d = new Date(1788196663 * 1000);
    const hms = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    expect(formatFrameTime('1788196663.226372')).toBe(`${hms}.226372`);
    expect(formatSeconds(Math.floor(1788196663.226372))).toBe(hms);
  });

  it('pads the fraction to six digits and tolerates a fraction-less ts', () => {
    const d = new Date(1788196663 * 1000);
    const hms = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    expect(formatFrameTime('1788196663.22')).toBe(`${hms}.220000`);
    expect(formatFrameTime('1788196663')).toBe(`${hms}.000000`);
  });
});

describe('formatDelta', () => {
  it('keeps 3 decimals with an explicit sign', () => {
    expect(formatDelta('1788196663.226372', '1788196662.000000')).toBe('+1.226s');
    expect(formatDelta('1788196660.5', '1788196662.0')).toBe('−1.500s');
    expect(formatDelta('5.0', '5.0')).toBe('+0.000s');
  });
});

describe('bucketBarWidth', () => {
  it('scales with count/maxCount and enforces the 3px minimum', () => {
    expect(bucketBarWidth(50, 100, 100)).toBe(50);
    expect(bucketBarWidth(1, 100, 100)).toBe(3);
    expect(bucketBarWidth(0, 100, 100)).toBe(0);
    expect(bucketBarWidth(10, 0, 100)).toBe(0); // degenerate max guard
  });
});

describe('maxBucketCount', () => {
  it('returns the largest count (0 for an empty histogram)', () => {
    const buckets: ReplayBucket[] = [
      { ts: '1788196663.000000', count: 7 },
      { ts: '1788196664.000000', count: 42 },
      { ts: '1788196665.000000', count: 3 },
    ];
    expect(maxBucketCount(buckets)).toBe(42);
    expect(maxBucketCount([])).toBe(0);
  });
});
