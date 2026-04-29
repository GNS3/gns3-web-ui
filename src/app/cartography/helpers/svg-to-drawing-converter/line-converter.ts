import { LineElement } from '../../models/drawings/line-element';
import { SvgConverter } from './svg-converter';

export class LineConverter implements SvgConverter {
  convert(element: Element): LineElement {
    const drawing = new LineElement();

    const stroke = element.attributes.getNamedItem('stroke');
    if (stroke) {
      drawing.stroke = stroke.value;
    }

    const stroke_width = element.attributes.getNamedItem('stroke-width');
    if (stroke_width) {
      drawing.stroke_width = parseInt(stroke_width.value, 10);
    }

    const stroke_dasharray = element.attributes.getNamedItem('stroke-dasharray');
    if (stroke_dasharray) {
      drawing.stroke_dasharray = stroke_dasharray.value;
    }

    const x1 = element.attributes.getNamedItem('x1');
    if (x1) {
      drawing.x1 = parseInt(x1.value, 10);
    }

    const x2 = element.attributes.getNamedItem('x2');
    if (x2) {
      drawing.x2 = parseInt(x2.value, 10);
    }

    const y1 = element.attributes.getNamedItem('y1');
    if (y1) {
      drawing.y1 = parseInt(y1.value, 10);
    }

    const y2 = element.attributes.getNamedItem('y2');
    if (y2) {
      drawing.y2 = parseInt(y2.value, 10);
    }

    // Parse marker attributes for arrows
    const marker_start = element.attributes.getNamedItem('marker-start');
    const marker_end = element.attributes.getNamedItem('marker-end');

    if (marker_start && marker_start.value.includes('line-start')) {
      drawing.arrow_start = true;
    } else {
      drawing.arrow_start = false;
    }

    if (marker_end && marker_end.value.includes('line-end')) {
      drawing.arrow_end = true;
    } else {
      drawing.arrow_end = false;
    }

    // Parse data-drawing-type attribute
    const drawing_type_attr = element.attributes.getNamedItem('data-drawing-type');
    if (drawing_type_attr && (drawing_type_attr.value === 'straight' || drawing_type_attr.value === 'freeform')) {
      drawing.drawing_type = drawing_type_attr.value;
    } else {
      drawing.drawing_type = 'straight';
    }

    // Parse data-control-offset attribute
    const control_offset_attr = element.attributes.getNamedItem('data-control-offset');
    if (control_offset_attr && control_offset_attr.value) {
      const offsets = control_offset_attr.value.split(',');
      if (offsets.length === 2) {
        drawing.control_offset = [parseInt(offsets[0], 10), parseInt(offsets[1], 10)];
      } else {
        drawing.control_offset = [0, 0];
      }
    } else {
      drawing.control_offset = [0, 0];
    }

    // Set default values
    drawing.arrow_start = drawing.arrow_start ?? false;
    drawing.arrow_end = drawing.arrow_end ?? false;

    return drawing;
  }
}
