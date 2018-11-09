import { Injectable } from "@angular/core";
import { DrawingsWidget } from "../widgets/drawings";
import { DraggableStart } from "../events/draggable";
import { Subscription } from "rxjs";
import { SelectionManager } from "../managers/selection-manager";
import { DrawingsEventSource } from "../events/drawings-event-source";
import { DraggedDataEvent } from "../events/event-source";
import { MapDrawing } from "../models/map/map-drawing";


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
    this.start = this.drawingsWidget.draggable.start.subscribe((evt: DraggableStart<MapDrawing>) => {
      const drawings = this.selectionManager.getSelectedDrawings();
      if (drawings.filter((n: MapDrawing) => n.id === evt.datum.id).length === 0) {
        this.selectionManager.setSelectedDrawings([evt.datum]);
      }
    });

    this.drag = this.drawingsWidget.draggable.drag.subscribe((evt: DraggableStart<MapDrawing>) => {
      const drawings = this.selectionManager.getSelectedDrawings();
      drawings.forEach((drawing: MapDrawing) => {
        drawing.x += evt.dx;
        drawing.y += evt.dy;
        this.drawingsWidget.redrawDrawing(svg, drawing);
      });
    });

    this.end = this.drawingsWidget.draggable.end.subscribe((evt: DraggableStart<MapDrawing>) => {
      const drawings = this.selectionManager.getSelectedDrawings();
      drawings.forEach((drawing: MapDrawing) => {
        this.drawingsEventSource.dragged.emit(new DraggedDataEvent<MapDrawing>(drawing));
      });
    });
  }

  public onDestroy() {
    this.start.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
  }
}