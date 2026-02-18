import { EventEmitter, Injectable } from '@angular/core';
import { MapLabel } from '../models/map/map-label';
import { MapNode } from '../models/map/map-node';
import { ClickedDataEvent, DraggedDataEvent } from './event-source';

@Injectable()
export class NodesEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<MapNode>>();
  public labelDragged = new EventEmitter<DraggedDataEvent<MapLabel>>();
  public clicked = new EventEmitter<ClickedDataEvent<MapNode>>();
}
