import { Injectable, EventEmitter } from '@angular/core';
import { MapLinkCreated } from './links';
import { MapLinkNode } from '../models/map/map-link-node';
import { DraggedDataEvent } from './event-source';

@Injectable()
export class LinksEventSource {
  public created = new EventEmitter<MapLinkCreated>();
  public interfaceDragged = new EventEmitter<DraggedDataEvent<MapLinkNode>>();
}
