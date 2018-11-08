import { Injectable, EventEmitter } from "@angular/core";
import { Node } from "../models/node";
import { DraggedDataEvent } from "./event-source";


@Injectable()
export class NodesEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<Node>>();
}