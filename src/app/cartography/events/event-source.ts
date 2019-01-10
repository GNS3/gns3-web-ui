import { TextElement } from '../models/drawings/text-element';
import { MapDrawing } from '../models/map/map-drawing';

export class DataEventSource<T> {
  constructor(
    public datum: T,
    public dx: number,
    public dy: number
  ) {}
}

export class DraggedDataEvent<T> extends DataEventSource<T> {}

export class ResizedDataEvent<T> {
  constructor(
    public datum: T,
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}
}

export class AddedDataEvent {
  constructor(
    public x: number,
    public y: number
  ) {}
}

export class ClickedDataEvent<T> {
  constructor(
    public datum: T,
    public x: number,
    public y: number
  ) {}
}

export class TextAddedDataEvent {
  constructor(
    public savedText: string,
    public x: number,
    public y: number
  ) {}
}

export class TextEditedDataEvent {
  constructor(
    public textDrawingId: string,
    public editedText: string,
    public textElement: TextElement
  ) {}
}

export class DrawingContextMenu {
  constructor(
    public event: any,
    public drawing: MapDrawing
  ) {}
}
