import { LineConverter } from './line-converter';

describe('LineConverter', () => {
  let lineConverter: LineConverter;

  beforeEach(() => {
    lineConverter = new LineConverter();
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
      'stroke': '#000000',
      'stroke-width': '2',
      'stroke-dasharray': '5,25,25',
      'x1': '10.10',
      'x2': '20',
      'y1': '30',
      'y2': '40',
    };
    const element = createMockElement(attrs);

    const drawing = lineConverter.convert(element);
    expect(drawing.stroke).toEqual('#000000');
    expect(drawing.stroke_width).toEqual(2.0);
    expect(drawing.stroke_dasharray).toEqual('5,25,25');
    expect(drawing.x1).toEqual(10);
    expect(drawing.x2).toEqual(20);
    expect(drawing.y1).toEqual(30);
    expect(drawing.y2).toEqual(40);
  });

  it('should parse with no attributes', () => {
    const element = createMockElement({});

    const drawing = lineConverter.convert(element);
    expect(drawing.stroke).toBeUndefined();
    expect(drawing.stroke_width).toBeUndefined();
    expect(drawing.stroke_dasharray).toBeUndefined();
    expect(drawing.x1).toBeUndefined();
    expect(drawing.x2).toBeUndefined();
    expect(drawing.y1).toBeUndefined();
    expect(drawing.y2).toBeUndefined();
  });
});
