import { EllipseConverter } from './ellipse-converter';

describe('EllipseConverter', () => {
  let ellipseConverter: EllipseConverter;

  beforeEach(() => {
    ellipseConverter = new EllipseConverter();
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
      'fill-opacity': '1.0',
      'stroke': '#000000',
      'stroke-width': '2',
      'stroke-dasharray': '5,25,25',
      'cx': '63',
      'cy': '59',
      'rx': '63',
      'ry': '59',
    };
    const element = createMockElement(attrs);

    const drawing = ellipseConverter.convert(element);
    expect(drawing.fill).toEqual('#ffffff');
    expect(drawing.fill_opacity).toEqual(1.0);
    expect(drawing.stroke).toEqual('#000000');
    expect(drawing.stroke_width).toEqual(2.0);
    expect(drawing.stroke_dasharray).toEqual('5,25,25');
    expect(drawing.cx).toEqual(63);
    expect(drawing.cy).toEqual(59);
    expect(drawing.rx).toEqual(63);
    expect(drawing.ry).toEqual(59);
  });

  it('should parse with no attributes', () => {
    const element = createMockElement({});

    const drawing = ellipseConverter.convert(element);
    expect(drawing.fill).toBeUndefined();
    expect(drawing.fill_opacity).toBeUndefined();
    expect(drawing.stroke).toBeUndefined();
    expect(drawing.stroke_width).toBeUndefined();
    expect(drawing.stroke_dasharray).toBeUndefined();
    expect(drawing.cx).toBeUndefined();
    expect(drawing.cy).toBeUndefined();
    expect(drawing.rx).toBeUndefined();
    expect(drawing.ry).toBeUndefined();
  });
});
