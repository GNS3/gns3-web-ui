import { Injectable } from '@angular/core';
import { Drawing } from '../../models/drawing';
import { MapDrawing } from '../../models/map/map-drawing';
import { Converter } from '../converter';

@Injectable()
export class DrawingToMapDrawingConverter implements Converter<Drawing, MapDrawing> {
  constructor() {}

  convert(drawing: Drawing) {
    const mapDrawing = new MapDrawing();
    mapDrawing.id = drawing.drawing_id;
    mapDrawing.projectId = drawing.project_id;
    mapDrawing.rotation = drawing.rotation;
    mapDrawing.svg = drawing.svg;
    mapDrawing.locked = drawing.locked;
    mapDrawing.x = drawing.x;
    mapDrawing.y = drawing.y;
    mapDrawing.z = drawing.z;
    return mapDrawing;
  }
}
