import { SvgConverter } from "./svg-converter";
import { ImageElement } from "../../../shared/models/drawings/image-element";


export class ImageConverter implements SvgConverter {
  convert(node: Node): ImageElement {
    const drawing = new ImageElement();

    const data = node.attributes.getNamedItem("xlink:href");
    if (data) {
      drawing.data = data.value;
    }

    const width = node.attributes.getNamedItem('width');
    if (width) {
      drawing.width = parseInt(width.value, 10);
    }

    const height = node.attributes.getNamedItem('height');
    if (height) {
      drawing.height = parseInt(height.value, 10);
    }

    return drawing;
  }
}
