import { Injectable, EventEmitter } from "@angular/core";
import { DraggedDataEvent, ResizedDataEvent, TextAddedDataEvent, TextEditedDataEvent } from "./event-source";
import { MapDrawing } from "../models/map/map-drawing";


@Injectable()
export class DrawingsEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<MapDrawing>>();
  public resized = new EventEmitter<ResizedDataEvent<MapDrawing>>();
  public saved = new EventEmitter<any>();
  public textAdded = new EventEmitter<TextAddedDataEvent>();
  public textEdited = new EventEmitter<TextEditedDataEvent>();
  public textSaved = new EventEmitter<any>();
}
