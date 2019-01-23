import { DrawingElementFactory } from './drawing-element-factory';
import { DrawingElement } from '../../models/drawings/drawing-element';
import { RectElement } from '../../models/drawings/rect-element';
import { Injectable } from '@angular/core';

@Injectable()
export class RectangleElementFactory implements DrawingElementFactory {
  getDrawingElement(): DrawingElement {
    let rectElement = new RectElement();
    rectElement.fill = '#ffffff';
    rectElement.fill_opacity = 1.0;
    rectElement.stroke = '#000000';
    rectElement.stroke_width = 2;
    rectElement.width = 200;
    rectElement.height = 100;
    return rectElement;
  }
}
