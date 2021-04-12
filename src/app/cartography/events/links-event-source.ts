import { EventEmitter, Injectable } from '@angular/core';
import { MapLinkNode } from '../models/map/map-link-node';
import { DraggedDataEvent } from './event-source';
import { MapLinkCreated } from './links';

@Injectable()
export class LinksEventSource {
  public created = new EventEmitter<MapLinkCreated>();
  public interfaceDragged = new EventEmitter<DraggedDataEvent<MapLinkNode>>();
}
