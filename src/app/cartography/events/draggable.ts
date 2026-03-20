import { EventEmitter } from '@angular/core';
import { drag, DraggedElementBaseType } from 'd3-drag';

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
    return drag<GElement, Datum>()
      .on('start', (event: any) => {
        startEvt = new DraggableStart<Datum>(event.subject);
        startEvt.dx = event.dx;
        startEvt.dy = event.dy;
        startEvt.x = event.x;
        startEvt.y = event.y;
        this.start.emit(startEvt);
      })
      .on('drag', (event: any) => {
        const evt = new DraggableDrag<Datum>(event.subject);
        // Use D3's event.dx/dy which are in local (canvas) coordinate space,
        // already accounting for zoom scale. Using raw clientX/Y deltas caused
        // nodes to move at the wrong speed when zoomed and jump on drag end.
        evt.dx = event.dx;
        evt.dy = event.dy;
        this.drag.emit(evt);
      })
      .on('end', (event: any) => {
        const evt = new DraggableEnd<Datum>(event.subject);
        evt.dx = event.x - startEvt.x;
        evt.dy = event.y - startEvt.y;
        this.end.emit(evt);
      });
  }
}
