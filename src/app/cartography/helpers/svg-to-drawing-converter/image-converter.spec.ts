import { ImageConverter } from './image-converter';

describe('ImageConverter', () => {
  let imageConverter: ImageConverter;

  beforeEach(() => {
    imageConverter = new ImageConverter();
  });

  it('should parse attributes', () => {
    const element = document.createElement('image');
    element.setAttribute('xlink:href', 'data:image/png');
    element.setAttribute('width', '100px');
    element.setAttribute('height', '200px');

    const drawing = imageConverter.convert(element);
    expect(drawing.data).toEqual('data:image/png');
    expect(drawing.width).toEqual(100);
    expect(drawing.height).toEqual(200);
  });

  it('should parse with no attributes', () => {
    const element = document.createElement('image');

    const drawing = imageConverter.convert(element);
    expect(drawing.data).toBeUndefined();
    expect(drawing.width).toBeUndefined();
    expect(drawing.height).toBeUndefined();
  });
});
