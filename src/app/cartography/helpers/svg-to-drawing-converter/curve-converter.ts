import { CurveElement, CurveType } from '../../models/drawings/curve-element';
import { SvgConverter } from './svg-converter';

export class CurveConverter implements SvgConverter {
  convert(element: Element): CurveElement {
    const drawing = new CurveElement();

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

    const curveType = element.attributes.getNamedItem('data-curve-type');
    if (curveType) {
      drawing.curve_type = curveType.value as CurveType;
    } else {
      drawing.curve_type = 'catmullrom';
    }

    const arrowStart = element.attributes.getNamedItem('data-arrow-start');
    if (arrowStart) {
      drawing.arrow_start = arrowStart.value === 'true';
    }

    const arrowEnd = element.attributes.getNamedItem('data-arrow-end');
    if (arrowEnd) {
      drawing.arrow_end = arrowEnd.value === 'true';
    }

    // Parse path d attribute to extract points
    const d = element.attributes.getNamedItem('d');
    if (d) {
      drawing.points = this.parsePathData(d.value);
    }

    return drawing;
  }

  private parsePathData(d: string): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    // Simple parser for M and L commands
    // Format: M x y L x y L x y ... or similar
    const commands = d.match(/[MLQCZ][^MLQCZ]*/gi);
    if (!commands) return points;

    for (const cmd of commands) {
      const type = cmd[0].toUpperCase();
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

      if (type === 'M' || type === 'L') {
        // Handle M x y or L x y
        for (let i = 0; i < coords.length; i += 2) {
          if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
            points.push({ x: coords[i], y: coords[i + 1] });
          }
        }
      } else if (type === 'Q') {
        // Quadratic bezier: Q cx cy x y
        for (let i = 0; i < coords.length; i += 4) {
          if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
            // Control point - skip or could add as separate point
          }
          if (!isNaN(coords[i + 2]) && !isNaN(coords[i + 3])) {
            points.push({ x: coords[i + 2], y: coords[i + 3] });
          }
        }
      } else if (type === 'C') {
        // Cubic bezier: C cx1 cy1 cx2 cy2 x y
        for (let i = 0; i < coords.length; i += 6) {
          if (!isNaN(coords[i + 4]) && !isNaN(coords[i + 5])) {
            points.push({ x: coords[i + 4], y: coords[i + 5] });
          }
        }
      }
      // Z command just closes path, no coordinates
    }

    return points;
  }
}
