import { EllipseConverter } from "./ellipse-converter";


describe('EllipseConverter', () => {
  let ellipseConverter: EllipseConverter;

  beforeEach(() => {
    ellipseConverter = new EllipseConverter();
  });

  it('should parse attributes', () => {
    const node = document.createElement("ellipse");
    node.setAttribute("fill", "#ffffff");
    node.setAttribute("fill-opacity", "1.0");
    node.setAttribute("stroke", "#000000");
    node.setAttribute("stroke-width", "2");
    node.setAttribute("stroke-dasharray", "5,25,25");
    node.setAttribute("cx", "63");
    node.setAttribute("cy", "59");
    node.setAttribute("rx", "63");
    node.setAttribute("ry", "59");

    const drawing = ellipseConverter.convert(node);
    expect(drawing.fill).toEqual("#ffffff");
    expect(drawing.fill_opacity).toEqual(1.0);
    expect(drawing.stroke).toEqual("#000000");
    expect(drawing.stroke_width).toEqual(2.0);
    expect(drawing.stroke_dasharray).toEqual("5,25,25");
    expect(drawing.cx).toEqual(63);
    expect(drawing.cy).toEqual(59);
    expect(drawing.rx).toEqual(63);
    expect(drawing.ry).toEqual(59);
  });

  it('should parse with no attributes', () => {
    const node = document.createElement("ellipse");

    const drawing = ellipseConverter.convert(node);
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
