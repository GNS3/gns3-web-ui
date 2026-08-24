import { Injectable } from '@angular/core';
import { Drawing } from '../../models/drawing';
import { MapDrawing } from '../../models/map/map-drawing';
import { Converter } from '../converter';
import { SvgToDrawingConverter } from '../../helpers/svg-to-drawing-converter';

@Injectable()
export class DrawingToMapDrawingConverter implements Converter<Drawing, MapDrawing> {
  constructor(private svgToDrawingConverter: SvgToDrawingConverter) {}

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
    // Parse the element eagerly: getSize() reads element.width/height to
    // reserve the drawing's box on the canvas, and it runs between
    // setDrawings() and the widget draw — the lazy conversion inside
    // DrawingsWidget.draw comes too late for the first sizing pass, so the
    // canvas clipped drawings at its edge (e.g. bottom-row text). Unsupported
    // svg leaves element undefined, which both getSize (?? 0 fallback) and
    // DrawingWidget (instanceof guards) already tolerate.
    try {
      mapDrawing.element = this.svgToDrawingConverter.convert(drawing.svg);
    } catch {
      // same as the widget's lazy path: render nothing for this drawing
    }
    return mapDrawing;
  }
}
