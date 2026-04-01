import { RectConverter } from './rect-converter';

describe('RectConverter', () => {
  let rectConverter: RectConverter;

  beforeEach(() => {
    rectConverter = new RectConverter();
  });

  const createMockElement = (attrs: Record<string, string>): Element => {
    const mockElement = {
      attributes: {
        getNamedItem: (name: string) => {
          const value = attrs[name];
          return value !== undefined ? { value } : null;
        },
      },
    } as unknown as Element;
    return mockElement;
  };

  it('should parse attributes', () => {
    const attrs = {
      'fill': '#ffffff',
      'fill-opacity': '0.7',
      'stroke': '#000000',
      'stroke-width': '2',
      'stroke-dasharray': '5,25,25',
      'width': '100px',
      'height': '200px',
      'rx': '0',
      'ry': '0',
    };
    const element = createMockElement(attrs);

    const drawing = rectConverter.convert(element);
    expect(drawing.fill).toEqual('#ffffff');
    expect(drawing.fill_opacity).toEqual(0.7);
    expect(drawing.stroke).toEqual('#000000');
    expect(drawing.stroke_dasharray).toEqual('5,25,25');
    expect(drawing.width).toEqual(100);
    expect(drawing.height).toEqual(200);
    expect(drawing.rx).toEqual(0);
    expect(drawing.ry).toEqual(0);
  });

  it('should parse with no attributes', () => {
    const element = createMockElement({});

    const drawing = rectConverter.convert(element);
    expect(drawing.fill).toBeUndefined();
    expect(drawing.fill_opacity).toBeUndefined();
    expect(drawing.stroke).toBeUndefined();
    expect(drawing.stroke_dasharray).toBeUndefined();
    expect(drawing.width).toBeUndefined();
    expect(drawing.height).toBeUndefined();
    expect(drawing.rx).toBeUndefined();
    expect(drawing.ry).toBeUndefined();
  });
});
