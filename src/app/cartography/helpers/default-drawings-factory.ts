import { Injectable } from '@angular/core';
import { TextElementFactory } from './drawings-factory/text-element-factory';
import { EllipseElementFactory } from './drawings-factory/ellipse-element-factory';
import { RectangleElementFactory } from './drawings-factory/rectangle-element-factory';
import { LineElementFactory } from './drawings-factory/line-element-factory';
import { DrawingElementFactory } from './drawings-factory/drawing-element-factory';
import { MapDrawing } from '../models/map/map-drawing';

@Injectable()
export class DefaultDrawingsFactory {
  private factory: DrawingElementFactory;
  private availableFactories: { [key: string]: DrawingElementFactory };

  constructor(
    private textElementFactory: TextElementFactory,
    private ellipseElementFactory: EllipseElementFactory,
    private rectangleElementFactory: RectangleElementFactory,
    private lineElementFactory: LineElementFactory
  ) {
    this.availableFactories = {
      text: this.textElementFactory,
      ellipse: this.ellipseElementFactory,
      rectangle: this.rectangleElementFactory,
      line: this.lineElementFactory
    };
  }

  getDrawingMock(drawingType: string) {
    this.factory = this.availableFactories[drawingType];

    let mapDrawing = new MapDrawing();
    mapDrawing.element = this.factory.getDrawingElement();

    return mapDrawing;
  }
}
