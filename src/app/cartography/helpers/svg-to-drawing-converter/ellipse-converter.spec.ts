import { EllipseConverter } from './ellipse-converter';

describe('EllipseConverter', () => {
  let ellipseConverter: EllipseConverter;

  beforeEach(() => {
    ellipseConverter = new EllipseConverter();
  });

  it('should parse attributes', () => {
    const element = document.createElement('ellipse');
    element.setAttribute('fill', '#ffffff');
    element.setAttribute('fill-opacity', '1.0');
    element.setAttribute('stroke', '#000000');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('stroke-dasharray', '5,25,25');
    element.setAttribute('cx', '63');
    element.setAttribute('cy', '59');
    element.setAttribute('rx', '63');
    element.setAttribute('ry', '59');

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
    const element = document.createElement('ellipse');

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
