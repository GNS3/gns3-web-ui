import { Injectable, EventEmitter } from "@angular/core";
import { DraggedDataEvent } from "./event-source";
import { MapNode } from "../models/map/map-node";


@Injectable()
export class NodesEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<MapNode>>();
}
