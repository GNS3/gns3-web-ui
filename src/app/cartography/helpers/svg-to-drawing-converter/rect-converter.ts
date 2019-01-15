import { SvgConverter } from './svg-converter';
import { RectElement } from '../../models/drawings/rect-element';

export class RectConverter implements SvgConverter {
  convert(element: Element): RectElement {
    const drawing = new RectElement();

    const fill = element.attributes.getNamedItem('fill');
    if (fill) {
      drawing.fill = fill.value;
    }

    const fill_opacity = element.attributes.getNamedItem('fill-opacity');
    if (fill) {
      drawing.fill_opacity = parseFloat(fill_opacity.value);
    }

    const stroke = element.attributes.getNamedItem('stroke');
    if (stroke) {
      drawing.stroke = stroke.value;
    }

    const stroke_width = element.attributes.getNamedItem('stroke-width');
    if (stroke) {
      drawing.stroke_width = parseInt(stroke_width.value, 10);
    }

    const stroke_dasharray = element.attributes.getNamedItem('stroke-dasharray');
    if (stroke_dasharray) {
      drawing.stroke_dasharray = stroke_dasharray.value;
    }

    const width = element.attributes.getNamedItem('width');
    if (width) {
      drawing.width = parseInt(width.value, 10);
    }

    const height = element.attributes.getNamedItem('height');
    if (height) {
      drawing.height = parseInt(height.value, 10);
    }

    return drawing;
  }
}
