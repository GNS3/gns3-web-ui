import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { MapDrawing } from '../../models/map/map-drawing';
import { RectElement } from '../../models/drawings/rect-element';
import { EllipseElement } from '../../models/drawings/ellipse-element';
import { LineElement } from '../../models/drawings/line-element';
import { TextElement } from '../../models/drawings/text-element';

@Injectable()
export class MapDrawingToSvgConverter implements Converter<MapDrawing, string> {
  constructor() {}

  convert(mapDrawing: MapDrawing) {
    let elem = ``;

    if (mapDrawing.element instanceof RectElement) {
      elem = `<rect fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" height=\"${
        mapDrawing.element.height
      }\" width=\"${mapDrawing.element.width}\" stroke=\"${mapDrawing.element.stroke}\" stroke-width=\"${
        mapDrawing.element.stroke_width
      }\" />`;
    } else if (mapDrawing.element instanceof EllipseElement) {
      elem = `<ellipse fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" cx=\"${
        mapDrawing.element.cx
      }\" cy=\"${mapDrawing.element.cy}\" rx=\"${mapDrawing.element.rx}\" ry=\"${mapDrawing.element.ry}\" stroke=\"${
        mapDrawing.element.stroke
      }\" stroke-width=\"${mapDrawing.element.stroke_width}\" />`;
    } else if (mapDrawing.element instanceof LineElement) {
      elem = `<line stroke=\"${mapDrawing.element.stroke}\" stroke-width=\"${mapDrawing.element.stroke_width}\" x1=\"${
        mapDrawing.element.x1
      }\" x2=\"${mapDrawing.element.x2}\" y1=\"${mapDrawing.element.y1}\" y2=\"${mapDrawing.element.y2}\" />`;
    } else if (mapDrawing.element instanceof TextElement) {
      elem = `<text fill=\"${mapDrawing.element.fill}\" fill-opacity=\"1.0\" font-family=\"${
        mapDrawing.element.font_family
      }\" font-size=\"${mapDrawing.element.font_size}\" font-weight=\"${mapDrawing.element.font_weight}\">${
        mapDrawing.element.text
      }</text>`;
    } else return '';

    return `<svg height=\"${mapDrawing.element.height}\" width=\"${mapDrawing.element.width}\">${elem}</svg>`;
  }
}
