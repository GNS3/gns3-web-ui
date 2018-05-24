import { SvgConverter } from "./svg-converter";
import { RectElement } from "../../models/drawings/rect-element";


export class RectConverter implements SvgConverter {
  convert(node: Node): RectElement {
    const drawing = new RectElement();

    const fill = node.attributes.getNamedItem("fill");
    if (fill) {
      drawing.fill = fill.value;
    }

    const fill_opacity = node.attributes.getNamedItem("fill-opacity");
    if (fill) {
      drawing.fill_opacity = parseFloat(fill_opacity.value);
    }

    const stroke = node.attributes.getNamedItem("stroke");
    if (stroke) {
      drawing.stroke = stroke.value;
    }

    const stroke_width = node.attributes.getNamedItem("stroke-width");
    if (stroke) {
      drawing.stroke_width = parseInt(stroke_width.value, 10);
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
