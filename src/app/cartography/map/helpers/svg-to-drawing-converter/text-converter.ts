import { SvgConverter } from "./svg-converter";
import { TextElement } from "../../../shared/models/drawings/text-element";


export class TextConverter implements SvgConverter {
  convert(node: Node): TextElement {
    const drawing = new TextElement();

    drawing.text = node.textContent;

    const fill = node.attributes.getNamedItem('fill');
    if (fill) {
      drawing.fill = fill.value;
    }

    const fill_opacity = node.attributes.getNamedItem('fill-opacity');
    if (fill_opacity) {
      drawing.fill_opacity = +fill_opacity.value;
    }

    const font_family = node.attributes.getNamedItem('font-family');
    if (font_family) {
      drawing.font_family = font_family.value;
    }

    const font_size = node.attributes.getNamedItem('font-size');
    if (font_size) {
      drawing.font_size = +font_size.value;
    }

    const font_weight = node.attributes.getNamedItem('font-weight');
    if (font_weight) {
      drawing.font_weight = font_weight.value;
    }

    return drawing;
  }
}
