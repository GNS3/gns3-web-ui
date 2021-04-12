import { Injectable } from '@angular/core';
import { MapDrawing } from '../models/map/map-drawing';
import { DrawingElementFactory } from './drawings-factory/drawing-element-factory';
import { EllipseElementFactory } from './drawings-factory/ellipse-element-factory';
import { LineElementFactory } from './drawings-factory/line-element-factory';
import { RectangleElementFactory } from './drawings-factory/rectangle-element-factory';
import { TextElementFactory } from './drawings-factory/text-element-factory';

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
      line: this.lineElementFactory,
    };
  }

  getDrawingMock(drawingType: string) {
    this.factory = this.availableFactories[drawingType];

    let mapDrawing = new MapDrawing();
    mapDrawing.element = this.factory.getDrawingElement();

    return mapDrawing;
  }
}
