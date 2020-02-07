import { Injectable } from '@angular/core';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { RectElement } from '../../models/drawings/rect-element';
import { DrawingElementFactory } from './drawing-element-factory';

@Injectable()
export class RectangleElementFactory implements DrawingElementFactory {
  getDrawingElement(): DrawingElement {
    const rectElement = new RectElement();
    rectElement.fill = '#ffffff';
    rectElement.fill_opacity = 1.0;
    rectElement.stroke = '#000000';
    rectElement.stroke_width = 2;
    rectElement.width = 200;
    rectElement.height = 100;
    return rectElement;
  }
}
