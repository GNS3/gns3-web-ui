import { EventEmitter } from "@angular/core";
import { drag, DraggedElementBaseType } from "d3-drag";
import { event } from "d3-selection";

class DraggableEvent {
  public dx: number;
  public dy: number;
}

export class DraggableStart<T> extends DraggableEvent {
  constructor(
    public datum: T
  ){
    super();
  }
}

export class DraggableDrag<T> extends DraggableEvent {
  constructor(
    public datum: T
  ){
    super();
  }
}

export class DraggableEnd<T> extends DraggableEvent {
  constructor(
    public datum: T
  ){
    super();
  }
}

export class Draggable<GElement extends DraggedElementBaseType, Datum> {
  public start = new EventEmitter<DraggableStart<Datum>>();
  public drag = new EventEmitter<DraggableStart<Datum>>();
  public end = new EventEmitter<DraggableStart<Datum>>();

  public call(selection) {
    selection.call(this.behaviour());
  }

  private behaviour() {
    return drag<GElement, Datum>()
      .on('start', (datum: Datum) => {
        const evt = new DraggableStart<Datum>(datum);
        evt.dx = event.dx;
        evt.dy = event.dy;
        this.start.emit(evt);
      })
      .on('drag', (datum: Datum) => {
        const evt = new DraggableDrag<Datum>(datum);
        evt.dx = event.dx;
        evt.dy = event.dy;
        this.drag.emit(evt);
      })
      .on('end', (datum: Datum) => {
        const evt = new DraggableEnd<Datum>(datum);
        evt.dx = event.dx;
        evt.dy = event.dy;
        this.end.emit(evt);
      });
  }
}