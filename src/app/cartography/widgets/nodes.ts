import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Layer  } from "../models/layer";
import { NodeWidget } from "./node";
import { Draggable } from "../events/draggable";
import { MapNode } from "../models/map/map-node";


@Injectable()
export class NodesWidget implements Widget {
  static NODE_LABEL_MARGIN = 3;

  public draggable = new Draggable<SVGGElement, MapNode>();
  public draggingEnabled = false;

  constructor(
    private nodeWidget: NodeWidget
  ) {
  }

  public redrawNode(view: SVGSelection, node: MapNode) {
    this.nodeWidget.draw(this.selectNode(view, node));
  }

  public draw(view: SVGSelection) {
    const node = view
      .selectAll<SVGGElement, MapNode>("g.node")
      .data((layer: Layer) => {
        if (layer.nodes) {
          return layer.nodes;
        }
        return [];
      }, (n: MapNode) => {
        return n.id;
      });

    const node_enter = node.enter()
      .append<SVGGElement>('g')
        .attr('class', 'node')
        .attr('node_id', (n: MapNode) => n.id)

    const merge = node.merge(node_enter);
    
    this.nodeWidget.draw(merge);

    node
      .exit()
        .remove();

    if (this.draggingEnabled) {
      this.draggable.call(merge);
    }
  }

  private selectNode(view: SVGSelection, node: MapNode) {
    return view.selectAll<SVGGElement, MapNode>(`g.node[node_id="${node.id}"]`);
  }

}
