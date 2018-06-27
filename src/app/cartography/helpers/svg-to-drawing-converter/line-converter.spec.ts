import { LineConverter } from "./line-converter";


describe('LineConverter', () => {
  let lineConverter: LineConverter;

  beforeEach(() => {
    lineConverter = new LineConverter();
  });

  it('should parse attributes', () => {
    const node = document.createElement("line");
    node.setAttribute("stroke", "#000000");
    node.setAttribute("stroke-width", "2");
    node.setAttribute("stroke-dasharray", "5,25,25");
    node.setAttribute("x1", "10.10");
    node.setAttribute("x2", "20");
    node.setAttribute("y1", "30");
    node.setAttribute("y2", "40");

    const drawing = lineConverter.convert(node);
    expect(drawing.stroke).toEqual("#000000");
    expect(drawing.stroke_width).toEqual(2.0);
    expect(drawing.stroke_dasharray).toEqual("5,25,25");
    expect(drawing.x1).toEqual(10);
    expect(drawing.x2).toEqual(20);
    expect(drawing.y1).toEqual(30);
    expect(drawing.y2).toEqual(40);
  });

  it('should parse with no attributes', () => {
    const node = document.createElement("line");

    const drawing = lineConverter.convert(node);
    expect(drawing.stroke).toBeUndefined();
    expect(drawing.stroke_width).toBeUndefined();
    expect(drawing.stroke_dasharray).toBeUndefined();
    expect(drawing.x1).toBeUndefined();
    expect(drawing.x2).toBeUndefined();
    expect(drawing.y1).toBeUndefined();
    expect(drawing.y2).toBeUndefined();
  });

});
