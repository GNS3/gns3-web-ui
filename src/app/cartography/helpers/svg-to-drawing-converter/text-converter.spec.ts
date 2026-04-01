import { TextConverter } from './text-converter';

describe('TextConverter', () => {
  let textConverter: TextConverter;

  beforeEach(() => {
    textConverter = new TextConverter();
  });

  const createMockElement = (attrs: Record<string, string>, text: string = ''): Element => {
    const mockElement = {
      textContent: text,
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
      'fill': '#00000',
      'fill-opacity': '1.0',
      'font-family': 'TypeWriter',
      'font-size': '10.0',
      'font-weight': 'bold',
      'text-decoration': 'line-through',
    };
    const element = createMockElement(attrs, 'Text');

    const drawing = textConverter.convert(element);
    expect(drawing.text).toEqual('Text');
    expect(drawing.fill).toEqual('#00000');
    expect(drawing.fill_opacity).toEqual(1.0);
    expect(drawing.font_family).toEqual('TypeWriter');
    expect(drawing.font_size).toEqual(10.0);
    expect(drawing.font_weight).toEqual('bold');
    expect(drawing.text_decoration).toEqual('line-through');
  });

  it('should parse with no attributes', () => {
    const element = createMockElement({});

    const drawing = textConverter.convert(element);
    expect(drawing.text).toEqual('');
    expect(drawing.fill).toBeUndefined();
    expect(drawing.fill_opacity).toBeUndefined();
    expect(drawing.font_family).toBeUndefined();
    expect(drawing.font_size).toBeUndefined();
    expect(drawing.font_weight).toBeUndefined();
    expect(drawing.text_decoration).toBeUndefined();
  });
});
