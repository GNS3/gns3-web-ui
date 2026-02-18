import { EventEmitter } from '@angular/core';
import { drag, DraggedElementBaseType } from 'd3-drag';
import { event } from 'd3-selection';

class DraggableEvent {
  public x: number;
  public y: number;
  public dx: number;
  public dy: number;
}

export class DraggableStart<T> extends DraggableEvent {
  constructor(public datum: T) {
    super();
  }
}

export class DraggableDrag<T> extends DraggableEvent {
  constructor(public datum: T) {
    super();
  }
}

export class DraggableEnd<T> extends DraggableEvent {
  constructor(public datum: T) {
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
    let startEvt;
    let lastX: number;
    let lastY: number;
    return drag<GElement, Datum>()
      .on('start', (datum: Datum) => {
        lastX = event.sourceEvent.clientX;
        lastY = event.sourceEvent.clientY;

        startEvt = new DraggableStart<Datum>(datum);
        startEvt.dx = event.dx;
        startEvt.dy = event.dy;
        startEvt.x = event.x;
        startEvt.y = event.y;
        this.start.emit(startEvt);
      })
      .on('drag', (datum: Datum) => {
        const evt = new DraggableDrag<Datum>(datum);
        evt.dx = event.sourceEvent.clientX - lastX;
        evt.dy = event.sourceEvent.clientY - lastY;
        lastX = event.sourceEvent.clientX;
        lastY = event.sourceEvent.clientY;
        this.drag.emit(evt);
      })
      .on('end', (datum: Datum) => {
        const evt = new DraggableEnd<Datum>(datum);
        evt.dx = event.x - startEvt.x;
        evt.dy = event.y - startEvt.y;
        this.end.emit(evt);
      });
  }
}
