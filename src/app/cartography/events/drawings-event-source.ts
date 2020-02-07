import { EventEmitter, Injectable } from '@angular/core';
import { MapDrawing } from '../models/map/map-drawing';
import {
  AddedDataEvent,
  DraggedDataEvent,
  ResizedDataEvent,
  TextAddedDataEvent,
  TextEditedDataEvent
} from './event-source';

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
