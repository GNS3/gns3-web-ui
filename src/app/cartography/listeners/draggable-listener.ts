import { Injectable } from "@angular/core";
import { NodesWidget } from "../widgets/nodes";
import { DraggableStart, DraggableDrag, DraggableEnd } from "../events/draggable";
import { Subscription } from "rxjs";
import { SelectionManager } from "../managers/selection-manager";
import { LinksWidget } from "../widgets/links";
import { NodesEventSource } from "../events/nodes-event-source";
import { DraggedDataEvent } from "../events/event-source";
import { MapNode } from "../models/map/map-node";
import { GraphDataManager } from "../managers/graph-data-manager";
import { DrawingsWidget } from "../widgets/drawings";
import { merge } from "rxjs";
import { MapDrawing } from "../models/map/map-drawing";
import { DrawingsEventSource } from "../events/drawings-event-source";


@Injectable()
export class DraggableListener {
  private start: Subscription;
  private drag: Subscription;
  private end: Subscription;

  constructor(
    private nodesWidget: NodesWidget,
    private drawingsWidget: DrawingsWidget,
    private linksWidget: LinksWidget,
    private selectionManager: SelectionManager,
    private nodesEventSource: NodesEventSource,
    private drawingsEventSource: DrawingsEventSource,
    private graphDataManager: GraphDataManager
  ) {
  }

  public onInit(svg: any) {
    this.start = merge(
      this.nodesWidget.draggable.start,
      this.drawingsWidget.draggable.start
    ).subscribe((evt: DraggableStart<any>) => {
      const selected = this.selectionManager.getSelected();

      if (evt.datum instanceof MapNode) {
        if (selected.filter((item) => item instanceof MapNode && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapDrawing) {
        if (selected.filter((item) => item instanceof MapDrawing && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }
    });

    this.drag = merge(
      this.nodesWidget.draggable.drag,
      this.drawingsWidget.draggable.drag
    ).subscribe((evt: DraggableDrag<any>) => {
      const selected = this.selectionManager.getSelected();

      // update nodes
      selected.filter((item) => item instanceof MapNode).forEach((node: MapNode) => {
        node.x += evt.dx;
        node.y += evt.dy;

        this.nodesWidget.redrawNode(svg, node);

        const links = this.graphDataManager.getLinks().filter(
          (link) => link.target.id === node.id || link.source.id === node.id);
        links.forEach((link) => {
          this.linksWidget.redrawLink(svg, link);
        });
      });

      // update drawings
      selected.filter((item) => item instanceof MapDrawing).forEach((drawing: MapDrawing) => {
        drawing.x += evt.dx;
        drawing.y += evt.dy;
        this.drawingsWidget.redrawDrawing(svg, drawing);
      });

    });

    this.end = merge(
      this.nodesWidget.draggable.end,
      this.drawingsWidget.draggable.end
    ).subscribe((evt: DraggableEnd<any>) => {
      const selected = this.selectionManager.getSelected();

      selected.filter((item) => item instanceof MapNode).forEach((item: MapNode) => {
        this.nodesEventSource.dragged.emit(new DraggedDataEvent<MapNode>(item, evt.dx, evt.dy));
      })

      selected.filter((item) => item instanceof MapDrawing).forEach((item: MapDrawing) => {
        this.drawingsEventSource.dragged.emit(new DraggedDataEvent<MapDrawing>(item, evt.dx, evt.dy));
      });
    });

  }

  public onDestroy() {
    this.start.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
  }
}