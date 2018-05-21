import { RectConverter } from "./rect-converter";


describe('RectConverter', () => {
  let rectConverter: RectConverter;

  beforeEach(() => {
    rectConverter = new RectConverter();
  });

  it('should parse attributes', () => {
    const node = document.createElement("rect");
    node.setAttribute("fill", "#ffffff");
    node.setAttribute("fill-opacity", "1.0");
    node.setAttribute("stroke", "#000000");
    node.setAttribute("stroke-width", "2");

    node.setAttribute("width", "100px");
    node.setAttribute("height", "200px");

    const drawing = rectConverter.convert(node);
    expect(drawing.fill).toEqual("#ffffff");
    expect(drawing.fill_opacity).toEqual(1.0);
    expect(drawing.stroke).toEqual("#000000");
    expect(drawing.stroke_width).toEqual(2.0);
    expect(drawing.width).toEqual(100);
    expect(drawing.height).toEqual(200);
  });

});
