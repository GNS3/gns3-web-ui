import { Injectable } from '@angular/core';
import { line, curveBasis, curveCatmullRom, curveMonotoneX as curveMonotone } from 'd3-shape';
import { CurveElement, CurveType } from '../../models/drawings/curve-element';
import { EllipseElement } from '../../models/drawings/ellipse-element';
import { LineElement } from '../../models/drawings/line-element';
import { RectElement } from '../../models/drawings/rect-element';
import { TextElement } from '../../models/drawings/text-element';
import { MapDrawing } from '../../models/map/map-drawing';
import { Converter } from '../converter';

@Injectable()
export class MapDrawingToSvgConverter implements Converter<MapDrawing, string> {
  constructor() {}

  private getCurveInterpolator(curveType: CurveType) {
    switch (curveType) {
      case 'basis':
        return curveBasis;
      case 'catmullrom':
        return curveCatmullRom;
      case 'monotone':
        return curveMonotone;
      default:
        return curveCatmullRom;
    }
  }

  convert(mapDrawing: MapDrawing) {
    let elem = ``;

    if (mapDrawing.element instanceof RectElement) {
      elem = `${
        mapDrawing.element.stroke_dasharray == ''
          ? `<rect fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" height=\"${mapDrawing.element.height}\" width=\"${mapDrawing.element.width}\" rx=\"${mapDrawing.element.rx}\" ry=\"${mapDrawing.element.ry}\" />`
          : `<rect fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" height=\"${mapDrawing.element.height}\" width=\"${mapDrawing.element.width}\" stroke=\"${mapDrawing.element.stroke}\" stroke-width=\"${mapDrawing.element.stroke_width}\" stroke-dasharray=\"${mapDrawing.element.stroke_dasharray}\" rx=\"${mapDrawing.element.rx}\" ry=\"${mapDrawing.element.ry}\" />`
      }`;
    } else if (mapDrawing.element instanceof EllipseElement) {
      elem = `${
        mapDrawing.element.stroke_dasharray == ''
          ? `<ellipse fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" cx=\"${mapDrawing.element.cx}\" cy=\"${mapDrawing.element.cy}\" rx=\"${mapDrawing.element.rx}\" ry=\"${mapDrawing.element.ry}\"/>`
          : `<ellipse fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" cx=\"${mapDrawing.element.cx}\" cy=\"${mapDrawing.element.cy}\" rx=\"${mapDrawing.element.rx}\" ry=\"${mapDrawing.element.ry}\" stroke=\"${mapDrawing.element.stroke}\" stroke-width=\"${mapDrawing.element.stroke_width}\" stroke-dasharray=\"${mapDrawing.element.stroke_dasharray}\" />`
      }`;
    } else if (mapDrawing.element instanceof LineElement) {
      const line = mapDrawing.element;
      const markerStart = line.arrow_start ? ' marker-start="url(#line-start)"' : '';
      const markerEnd = line.arrow_end ? ' marker-end="url(#line-end)"' : '';
      elem = `<line stroke=\"${line.stroke}\" stroke-width=\"${line.stroke_width}\" x1=\"${
        line.x1
      }\" x2=\"${line.x2}\" y1=\"${line.y1}\" y2=\"${
        line.y2
      }\" stroke-dasharray=\"${line.stroke_dasharray ?? 'none'}\"${markerStart}${markerEnd} data-drawing-type=\"${line.drawing_type ?? 'straight'}\" data-arrow-start=\"${line.arrow_start ?? false}\" data-arrow-end=\"${line.arrow_end ?? false}\" />`;
    } else if (mapDrawing.element instanceof CurveElement) {
      // Generate path data from points
      const curve = mapDrawing.element;
      const points: [number, number][] = curve.points.map((p) => [p.x, p.y]);
      const lineGenerator = line<[number, number]>().curve(this.getCurveInterpolator(curve.curve_type || 'catmullrom'));
      const pathData = lineGenerator(points) || '';
      elem = `<path d=\"${pathData}\" stroke=\"${curve.stroke}\" stroke-width=\"${curve.stroke_width}\" stroke-dasharray=\"${curve.stroke_dasharray ?? 'none'}\" fill=\"none\" data-curve-type=\"${curve.curve_type ?? 'catmullrom'}\" data-arrow-start=\"${curve.arrow_start}\" data-arrow-end=\"${curve.arrow_end}\" />`;
    } else if (mapDrawing.element instanceof TextElement) {
      elem = `<text fill=\"${mapDrawing.element.fill}\" fill-opacity=\"1.0\" font-family=\"${mapDrawing.element.font_family}\" font-size=\"${mapDrawing.element.font_size}\" font-weight=\"${mapDrawing.element.font_weight}\">${mapDrawing.element.text}</text>`;
    } else return '';

    return `<svg height=\"${mapDrawing.element.height}\" width=\"${mapDrawing.element.width}\">${elem}</svg>`;
  }
}
