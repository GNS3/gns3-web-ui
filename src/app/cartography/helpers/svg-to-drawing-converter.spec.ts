import { SvgToDrawingConverter } from './svg-to-drawing-converter';
import { TextElement } from '../models/drawings/text-element';

describe('SvgToDrawingHelper', () => {
  let svgToDrawingConverter: SvgToDrawingConverter;

  beforeEach(() => {
    svgToDrawingConverter = new SvgToDrawingConverter();
  });

  it('should raise Error on empty string', () => {
    expect(() => svgToDrawingConverter.convert('')).toThrowError(Error);
  });

  it('should raise Error on no children', () => {
    expect(() => svgToDrawingConverter.convert('<svg></svg>')).toThrowError(Error);
  });

  it('should raise Error on unknown parser', () => {
    expect(() => svgToDrawingConverter.convert('<svg><unkown></unkown></svg>')).toThrowError(Error);
  });

  it('should parse width and height if defined', () => {
    const svg =
      '<svg height="53" width="78">' +
      '<text fill="#000000" fill-opacity="1.0" font-family="TypeWriter" font-size="10.0" font-weight="bold">' +
      'Line' +
      '</text>' +
      '</svg>';

    const drawing = svgToDrawingConverter.convert(svg);

    expect(drawing.width).toBe(78);
    expect(drawing.height).toBe(53);
  });

  it('should parse element even when is text between', () => {
    const svg = '<svg height="53" width="78">    <text>Label</text>    </svg>';
    const drawing: TextElement = svgToDrawingConverter.convert(svg) as TextElement;
    expect(drawing.text).toEqual('Label');
  });

  it('should match supported elements', () => {
    expect(svgToDrawingConverter.supportedTags()).toEqual(['text', 'image', 'rect', 'line', 'ellipse']);
  });
});
