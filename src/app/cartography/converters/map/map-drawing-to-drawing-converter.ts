import { Injectable } from '@angular/core';
import { Drawing } from '../../models/drawing';
import { MapDrawing } from '../../models/map/map-drawing';
import { Converter } from '../converter';

@Injectable()
export class MapDrawingToDrawingConverter implements Converter<MapDrawing, Drawing> {
  constructor() {}

  convert(mapDrawing: MapDrawing) {
    const drawing = new Drawing();
    drawing.drawing_id = mapDrawing.id;
    drawing.project_id = mapDrawing.projectId;
    drawing.rotation = mapDrawing.rotation;
    drawing.svg = mapDrawing.svg;
    drawing.locked = mapDrawing.locked;
    drawing.x = mapDrawing.x;
    drawing.y = mapDrawing.y;
    drawing.z = mapDrawing.z;
    drawing.element = mapDrawing.element;
    return drawing;
  }
}
