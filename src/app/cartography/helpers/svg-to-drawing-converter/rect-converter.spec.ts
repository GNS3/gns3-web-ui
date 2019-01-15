import { RectConverter } from './rect-converter';

describe('RectConverter', () => {
  let rectConverter: RectConverter;

  beforeEach(() => {
    rectConverter = new RectConverter();
  });

  it('should parse attributes', () => {
    const element = document.createElement('rect');
    element.setAttribute('fill', '#ffffff');
    element.setAttribute('fill-opacity', '0.7');
    element.setAttribute('stroke', '#000000');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('stroke-dasharray', '5,25,25');

    element.setAttribute('width', '100px');
    element.setAttribute('height', '200px');

    const drawing = rectConverter.convert(element);
    expect(drawing.fill).toEqual('#ffffff');
    expect(drawing.fill_opacity).toEqual(0.7);
    expect(drawing.stroke).toEqual('#000000');
    expect(drawing.stroke_dasharray).toEqual('5,25,25');
    expect(drawing.width).toEqual(100);
    expect(drawing.height).toEqual(200);
  });

  it('should parse with no attributes', () => {
    const element = document.createElement('rect');

    const drawing = rectConverter.convert(element);
    expect(drawing.fill).toBeUndefined();
    expect(drawing.fill_opacity).toBeUndefined();
    expect(drawing.stroke).toBeUndefined();
    expect(drawing.stroke_dasharray).toBeUndefined();
    expect(drawing.width).toBeUndefined();
    expect(drawing.height).toBeUndefined();
  });
});
