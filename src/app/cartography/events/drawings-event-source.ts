import { Injectable, EventEmitter } from "@angular/core";
import { DraggedDataEvent } from "./event-source";
import { MapDrawing } from "../models/map/map-drawing";


@Injectable()
export class DrawingsEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<MapDrawing>>();
}
