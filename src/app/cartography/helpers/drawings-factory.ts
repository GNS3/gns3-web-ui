import { Injectable } from "@angular/core";
import { TextElementFactory } from './drawings-factory/text-element-factory';
import { EllipseElementFactory } from './drawings-factory/ellipse-element-factory';
import { RectangleElementFactory } from './drawings-factory/rectangle-element-factory';
import { LineElementFactory } from './drawings-factory/line-element-factory';
import { DrawingElementFactory } from './drawings-factory/drawing-element-factory';
import { MapDrawing } from '../models/map/map-drawing';

@Injectable()
export class DrawingsFactory {
    private factory: DrawingElementFactory;
    private availablefactories = {
        'text': new TextElementFactory,
        'ellipse': new EllipseElementFactory,
        'rectangle': new RectangleElementFactory,
        'line': new LineElementFactory
    };

    getDrawingMock(drawingType: string){
        this.factory = this.availablefactories[drawingType];

        let mapDrawing = new MapDrawing();
        mapDrawing.element = this.factory.getDrawingElement();

        return mapDrawing;
    }
}
