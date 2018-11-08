import { Injectable } from "@angular/core";
import { NodesWidget } from "../widgets/nodes";
import { DraggableStart } from "../events/draggable";
import { Node } from "../models/node";
import { Subscription } from "rxjs";
import { SelectionManager } from "../managers/selection-manager";
import { LinksWidget } from "../widgets/links";
import { GraphLayout } from "../widgets/graph-layout";
import { NodesEventSource } from "../events/nodes-event-source";
import { DraggedDataEvent } from "../events/event-source";


@Injectable()
export class NodesDraggableListener {
  private start: Subscription;
  private drag: Subscription;
  private end: Subscription;

  constructor(
    private nodesWidget: NodesWidget,
    private linksWidget: LinksWidget,
    private selectionManager: SelectionManager,
    private graphLayout: GraphLayout,
    private nodesEventSource: NodesEventSource
  ) {
  }

  public onInit(svg: any) {
    this.start = this.nodesWidget.draggable.start.subscribe((evt: DraggableStart<Node>) => {
      let nodes = this.selectionManager.getSelectedNodes();
      if (nodes.filter((n: Node) => n.node_id === evt.datum.node_id).length === 0) {
        this.selectionManager.setSelectedNodes([evt.datum]);
      }
    });

    this.drag = this.nodesWidget.draggable.drag.subscribe((evt: DraggableStart<Node>) => {
      let nodes = this.selectionManager.getSelectedNodes();
      nodes.forEach((node: Node) => {
        node.x += evt.dx;
        node.y += evt.dy;
        this.nodesWidget.redrawNode(svg, node);

        const links = this.graphLayout.getLinks().filter((link) => link.target.node_id === node.node_id || link.source.node_id === node.node_id);
        links.forEach((link) => {
          this.linksWidget.redrawLink(svg, link);
        });
      });
    });

    this.end = this.nodesWidget.draggable.end.subscribe((evt: DraggableStart<Node>) => {
      let nodes = this.selectionManager.getSelectedNodes();
      nodes.forEach((node: Node) => {
        this.nodesEventSource.dragged.emit(new DraggedDataEvent<Node>(node));
      });
    });
  }

  public onDestroy() {
    this.start.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
  }
}