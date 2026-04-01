import { ImageConverter } from './image-converter';

describe('ImageConverter', () => {
  let imageConverter: ImageConverter;

  beforeEach(() => {
    imageConverter = new ImageConverter();
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
      'xlink:href': 'data:image/png',
      'width': '100px',
      'height': '200px',
    };
    const element = createMockElement(attrs);

    const drawing = imageConverter.convert(element);
    expect(drawing.data).toEqual('data:image/png');
    expect(drawing.width).toEqual(100);
    expect(drawing.height).toEqual(200);
  });

  it('should parse with no attributes', () => {
    const element = createMockElement({});

    const drawing = imageConverter.convert(element);
    expect(drawing.data).toBeUndefined();
    expect(drawing.width).toBeUndefined();
    expect(drawing.height).toBeUndefined();
  });
});
