import { EventEmitter, Injectable } from '@angular/core';
import { MapLink } from '../models/map/map-link';
import { MapLinkNode } from '../models/map/map-link-node';
import { DraggedDataEvent } from './event-source';
import { MapLinkCreated } from './links';

@Injectable()
export class LinksEventSource {
  public created = new EventEmitter<MapLinkCreated>();
  public edited = new EventEmitter<MapLink>();
  public interfaceDragged = new EventEmitter<DraggedDataEvent<MapLinkNode>>();
}
