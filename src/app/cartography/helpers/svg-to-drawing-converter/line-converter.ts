import { SvgConverter } from "./svg-converter";
import { LineElement } from "../../models/drawings/line-element";


export class LineConverter implements SvgConverter {
  convert(node: Node): LineElement {
    const drawing = new LineElement();

    const stroke = node.attributes.getNamedItem("stroke");
    if (stroke) {
      drawing.stroke = stroke.value;
    }

    const stroke_width = node.attributes.getNamedItem("stroke-width");
    if (stroke) {
      drawing.stroke_width = parseInt(stroke_width.value, 10);
    }

    const stroke_dasharray = node.attributes.getNamedItem("stroke-dasharray");
    if (stroke_dasharray) {
      drawing.stroke_dasharray = stroke_dasharray.value;
    }

    const x1 = node.attributes.getNamedItem('x1');
    if (x1) {
      drawing.x1 = parseInt(x1.value, 10);
    }

    const x2 = node.attributes.getNamedItem('x2');
    if (x2) {
      drawing.x2 = parseInt(x2.value, 10);
    }

    const y1 = node.attributes.getNamedItem('y1');
    if (y1) {
      drawing.y1 = parseInt(y1.value, 10);
    }

    const y2 = node.attributes.getNamedItem('y2');
    if (y2) {
      drawing.y2 = parseInt(y2.value, 10);
    }

    return drawing;
  }
}
