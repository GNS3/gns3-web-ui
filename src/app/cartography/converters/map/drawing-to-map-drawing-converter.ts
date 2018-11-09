import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { Drawing } from "../../models/drawing";
import { MapDrawing } from "../../models/map/map-drawing";


@Injectable()
export class DrawingToMapDrawingConverter implements Converter<Drawing, MapDrawing> {
    constructor(
    ) {}
    
    convert(drawing: Drawing) {
        const mapDrawing = new MapDrawing();
        mapDrawing.id = drawing.drawing_id;
        mapDrawing.projectId = drawing.project_id;
        mapDrawing.rotation = drawing.rotation;
        mapDrawing.svg = drawing.svg;
        mapDrawing.x = drawing.x;
        mapDrawing.y = drawing.y;
        mapDrawing.z = drawing.z;
        return mapDrawing;
    }
}
