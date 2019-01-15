import { SvgConverter } from './svg-converter';
import { TextElement } from '../../models/drawings/text-element';

export class TextConverter implements SvgConverter {
  convert(element: Element): TextElement {
    const drawing = new TextElement();

    drawing.text = element.textContent;

    const fill = element.attributes.getNamedItem('fill');
    if (fill) {
      drawing.fill = fill.value;
    }

    const fill_opacity = element.attributes.getNamedItem('fill-opacity');
    if (fill_opacity) {
      drawing.fill_opacity = parseFloat(fill_opacity.value);
    }

    const font_family = element.attributes.getNamedItem('font-family');
    if (font_family) {
      drawing.font_family = font_family.value;
    }

    const font_size = element.attributes.getNamedItem('font-size');
    if (font_size) {
      drawing.font_size = +font_size.value;
    }

    const font_weight = element.attributes.getNamedItem('font-weight');
    if (font_weight) {
      drawing.font_weight = font_weight.value;
    }

    const text_decoration = element.attributes.getNamedItem('text-decoration');
    if (text_decoration) {
      drawing.text_decoration = text_decoration.value;
    }

    return drawing;
  }
}
