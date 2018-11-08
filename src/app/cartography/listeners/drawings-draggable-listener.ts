import { Injectable } from "@angular/core";
import { DrawingsWidget } from "../widgets/drawings";
import { DraggableStart } from "../events/draggable";
import { Drawing } from "../models/drawing";
import { Subscription } from "rxjs";
import { SelectionManager } from "../managers/selection-manager";
import { DrawingsEventSource } from "../events/drawings-event-source";
import { DraggedDataEvent } from "../events/event-source";


@Injectable()
export class DrawingsDraggableListener {
  private start: Subscription;
  private drag: Subscription;
  private end: Subscription;

  constructor(
    private drawingsWidget: DrawingsWidget,
    private selectionManager: SelectionManager,
    private drawingsEventSource: DrawingsEventSource
  ) {
  }

  public onInit(svg: any) {
    this.start = this.drawingsWidget.draggable.start.subscribe((evt: DraggableStart<Drawing>) => {
      let drawings = this.selectionManager.getSelectedDrawings();
      if (drawings.filter((n: Drawing) => n.drawing_id === evt.datum.drawing_id).length === 0) {
        this.selectionManager.setSelectedDrawings([evt.datum]);
      }
    });

    this.drag = this.drawingsWidget.draggable.drag.subscribe((evt: DraggableStart<Drawing>) => {
      let drawings = this.selectionManager.getSelectedDrawings();
      drawings.forEach((drawing: Drawing) => {
        drawing.x += evt.dx;
        drawing.y += evt.dy;
        this.drawingsWidget.redrawDrawing(svg, drawing);
      });
    });

    this.end = this.drawingsWidget.draggable.end.subscribe((evt: DraggableStart<Drawing>) => {
      let drawings = this.selectionManager.getSelectedDrawings();
      drawings.forEach((drawing: Drawing) => {
        this.drawingsEventSource.dragged.emit(new DraggedDataEvent<Drawing>(drawing));
      });
    });
  }

  public onDestroy() {
    this.start.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
  }
}