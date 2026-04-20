import { Injectable } from '@angular/core';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { CurveElement } from '../../models/drawings/curve-element';
import { DrawingElementFactory } from './drawing-element-factory';

@Injectable()
export class CurveElementFactory implements DrawingElementFactory {
  getDrawingElement(): DrawingElement {
    let curveElement = new CurveElement();
    curveElement.stroke = 'var(--gns3-canvas-link-color)';
    curveElement.stroke_width = 2;
    curveElement.stroke_dasharray = 'none';
    curveElement.points = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 200, y: 0 },
    ];
    curveElement.curve_type = 'catmullrom';
    curveElement.arrow_start = false;
    curveElement.arrow_end = true;
    curveElement.width = 200;
    curveElement.height = 50;
    return curveElement;
  }
}
