import { DrawingElementFactory } from './drawing-element-factory';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { EllipseElement } from '../../models/drawings/ellipse-element';
import { Injectable } from '@angular/core';

@Injectable()
export class EllipseElementFactory implements DrawingElementFactory {
  getDrawingElement(): DrawingElement {
    let ellipseElement = new EllipseElement();
    ellipseElement.fill = '#ffffff';
    ellipseElement.fill_opacity = 1.0;
    ellipseElement.stroke = '#000000';
    ellipseElement.stroke_width = 2;
    ellipseElement.cx = 100;
    ellipseElement.cy = 100;
    ellipseElement.rx = 100;
    ellipseElement.ry = 100;
    ellipseElement.width = 200;
    ellipseElement.height = 200;
    return ellipseElement;
  }
}
