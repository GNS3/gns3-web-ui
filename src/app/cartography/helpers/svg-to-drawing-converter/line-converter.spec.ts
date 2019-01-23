import { LineConverter } from './line-converter';

describe('LineConverter', () => {
  let lineConverter: LineConverter;

  beforeEach(() => {
    lineConverter = new LineConverter();
  });

  it('should parse attributes', () => {
    const element = document.createElement('line');
    element.setAttribute('stroke', '#000000');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('stroke-dasharray', '5,25,25');
    element.setAttribute('x1', '10.10');
    element.setAttribute('x2', '20');
    element.setAttribute('y1', '30');
    element.setAttribute('y2', '40');

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
    const element = document.createElement('line');

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
