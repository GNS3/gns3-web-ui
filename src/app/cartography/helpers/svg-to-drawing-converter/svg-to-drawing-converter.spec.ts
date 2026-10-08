// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { EllipseElement } from '../../models/drawings/ellipse-element';
import { RectElement } from '../../models/drawings/rect-element';
import { SvgToDrawingConverter } from '../svg-to-drawing-converter';

describe('SvgToDrawingConverter optional svg attributes', () => {
  const converter = new SvgToDrawingConverter();

  it('parses a rect that omits fill-opacity (regression: used to throw and drop the drawing)', () => {
    // real-world sample: fill present, fill-opacity absent — hand-crafted svg.
    // RectConverter used to read fill_opacity.value under an `if (fill)` guard,
    // throwing a TypeError that both call sites swallowed, leaving the drawing
    // completely invisible.
    const svg =
      '<svg width="580" height="272"><rect x="0" y="0" width="580" height="272" fill="#f8f8f2" stroke="#333333" stroke-width="1" rx="6"/></svg>';

    const element = converter.convert(svg) as RectElement;

    expect(element).toBeInstanceOf(RectElement);
    expect(element.fill).toBe('#f8f8f2');
    expect(element.stroke).toBe('#333333');
    expect(element.stroke_width).toBe(1);
    expect(element.rx).toBe(6);
    expect(element.width).toBe(580);
    expect(element.height).toBe(272);
  });

  it('parses an ellipse that omits fill-opacity and stroke-width', () => {
    const svg = '<svg width="100" height="80"><ellipse cx="50" cy="40" rx="45" ry="35" fill="#ffffff" stroke="#000000"/></svg>';

    const element = converter.convert(svg) as EllipseElement;

    expect(element).toBeInstanceOf(EllipseElement);
    expect(element.fill).toBe('#ffffff');
    expect(element.stroke).toBe('#000000');
    expect(element.cx).toBe(50);
    expect(element.cy).toBe(40);
    expect(element.rx).toBe(45);
    expect(element.ry).toBe(35);
  });

  it('still reads explicit optional attributes', () => {
    const svg =
      '<svg width="10" height="10"><rect width="10" height="10" fill="#112233" fill-opacity="0.5" stroke="#445566" stroke-width="2" stroke-dasharray="5,5"/></svg>';

    const element = converter.convert(svg) as RectElement;

    expect(element.fill_opacity).toBe(0.5);
    expect(element.stroke_width).toBe(2);
    expect(element.stroke_dasharray).toBe('5,5');
  });
});
