import { TextConverter } from "./text-converter";


describe('SvgToDrawingHelper', () => {
  let textConverter: TextConverter;

  beforeEach(() => {
    textConverter = new TextConverter();
  });

  it('should parse attributes', () => {
    const node = document.createElement("text");
    node.innerText = "Text";
    node.setAttribute("fill", "#00000");
    node.setAttribute("fill-opacity", "1.0");
    node.setAttribute("font-family", "TypeWriter");
    node.setAttribute("font-size", "10.0");
    node.setAttribute("font-weight", "bold");

    const drawing = textConverter.convert(node);
    expect(drawing.text).toEqual("Text");
    expect(drawing.fill).toEqual("#00000");
    expect(drawing.fill_opacity).toEqual(1.0);
    expect(drawing.font_family).toEqual("TypeWriter");
    expect(drawing.font_size).toEqual(10.0);
    expect(drawing.font_weight).toEqual("bold");
  });

});
