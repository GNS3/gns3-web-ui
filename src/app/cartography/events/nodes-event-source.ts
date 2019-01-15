import { Injectable, EventEmitter } from '@angular/core';
import { DraggedDataEvent, ClickedDataEvent } from './event-source';
import { MapNode } from '../models/map/map-node';
import { MapLabel } from '../models/map/map-label';

@Injectable()
export class NodesEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<MapNode>>();
  public labelDragged = new EventEmitter<DraggedDataEvent<MapLabel>>();
  public clicked = new EventEmitter<ClickedDataEvent<MapNode>>();
}
