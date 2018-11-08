import { Injectable, EventEmitter } from "@angular/core";
import { Drawing } from "../models/drawing";
import { DraggedDataEvent } from "./event-source";


@Injectable()
export class DrawingsEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<Drawing>>();
}