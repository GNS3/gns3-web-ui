import { Injectable, EventEmitter } from '@angular/core';
import {
  DraggedDataEvent,
  ResizedDataEvent,
  TextAddedDataEvent,
  TextEditedDataEvent,
  AddedDataEvent
} from './event-source';
import { MapDrawing } from '../models/map/map-drawing';

@Injectable()
export class DrawingsEventSource {
  public dragged = new EventEmitter<DraggedDataEvent<MapDrawing>>();
  public resized = new EventEmitter<ResizedDataEvent<MapDrawing>>();
  public selected = new EventEmitter<string>();
  public pointToAddSelected = new EventEmitter<AddedDataEvent>();
  public saved = new EventEmitter<any>();

  public textAdded = new EventEmitter<TextAddedDataEvent>();
  public textEdited = new EventEmitter<TextEditedDataEvent>();
  public textSaved = new EventEmitter<any>();
}
