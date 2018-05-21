import { ImageConverter } from "./image-converter";


describe('ImageConverter', () => {
  let imageConverter: ImageConverter;

  beforeEach(() => {
    imageConverter = new ImageConverter();
  });

  it('should parse attributes', () => {
    const node = document.createElement("image");
    node.setAttribute("xlink:href", "data:image/png");
    node.setAttribute("width", "100px");
    node.setAttribute("height", "200px");

    const drawing = imageConverter.convert(node);
    expect(drawing.data).toEqual("data:image/png");
    expect(drawing.width).toEqual(100);
    expect(drawing.height).toEqual(200);
  });

});
