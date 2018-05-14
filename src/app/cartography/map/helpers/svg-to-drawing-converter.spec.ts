import { SvgToDrawingConverter } from "./svg-to-drawing-converter";


describe('SvgToDrawingHelper', () => {
  let svgToDrawingConverter: SvgToDrawingConverter;

  beforeEach(() => {
    svgToDrawingConverter = new SvgToDrawingConverter();
  });

  it('should raise Error on empty string', () => {
    expect(() => svgToDrawingConverter.convert("")).toThrowError(Error);
  });

  it('should raise Error on no children', () => {
    expect(() => svgToDrawingConverter.convert("<svg></svg>")).toThrowError(Error);
  });

    it('should raise Error on unknown parser', () => {
    expect(() => svgToDrawingConverter.convert("<svg><unkown></unkown></svg>")).toThrowError(Error);
  });

  it('should parse text drawing', () => {
    const svg = '<svg height="53" width="78">' +
      '<text fill="#000000" fill-opacity="1.0" font-family="TypeWriter" font-size="10.0" font-weight="bold">' +
      'Line' +
      '</text>' +
      '</svg>';

    const drawing = svgToDrawingConverter.convert(svg);

    expect(drawing.width).toBe(78);
    expect(drawing.height).toBe(53);
  });
});
