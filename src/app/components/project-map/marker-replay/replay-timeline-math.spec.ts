import { describe, it, expect } from 'vitest';
import { formatDelta, formatFrameTime, formatSeconds } from './replay-timeline-math';

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
