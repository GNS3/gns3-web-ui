import { SvgConverter } from "./svg-converter";
import { DrawingElement } from "../../../shared/models/drawings/drawing-element";
import { TextElement } from "../../../shared/models/drawings/text-element";


export class TextConverter implements SvgConverter {
  convert(node: Node): DrawingElement {
    const drawing = new TextElement();
    const fill = node.attributes.getNamedItem('fill');
    if (fill) {
      drawing.fill = fill.value;
    }
    return drawing;
  }
}
