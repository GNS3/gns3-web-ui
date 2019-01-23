import { DrawingElementFactory } from './drawing-element-factory';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { LineElement } from '../../models/drawings/line-element';
import { Injectable } from '@angular/core';

@Injectable()
export class LineElementFactory implements DrawingElementFactory {
  getDrawingElement(): DrawingElement {
    let lineElement = new LineElement();
    lineElement.stroke = '#000000';
    lineElement.stroke_width = 2;
    lineElement.x1 = 0;
    lineElement.x2 = 200;
    lineElement.y1 = 0;
    lineElement.y2 = 0;
    lineElement.width = 100;
    lineElement.height = 0;
    return lineElement;
  }
}
