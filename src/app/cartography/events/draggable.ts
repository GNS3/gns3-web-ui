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

// Zoneless-compatible d3-drag wrapper
// In zoneless mode, d3 events don't trigger Angular change detection automatically.
// Subscribers should use markForCheck() when they need to trigger CD.
export class Draggable<GElement extends DraggedElementBaseType, Datum> {
  public start = new EventEmitter<DraggableStart<Datum>>();
  public drag = new EventEmitter<DraggableStart<Datum>>();
  public end = new EventEmitter<DraggableStart<Datum>>();

  public call(selection) {
    // In zoneless mode, d3 runs without Angular's change detection
    // Events are emitted and subscribers handle change detection via markForCheck()
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
