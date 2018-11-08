import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { Node } from "../models/node";
import { SVGSelection } from "../models/types";
import { Layer  } from "../models/layer";
import { NodeWidget } from "./node";
import { Draggable } from "../events/draggable";


@Injectable()
export class NodesWidget implements Widget {
  static NODE_LABEL_MARGIN = 3;

  public draggable = new Draggable<SVGGElement, Node>();
  
  constructor(
    private nodeWidget: NodeWidget
  ) {
  }

  public redrawNode(view: SVGSelection, node: Node) {
    this.nodeWidget.draw(this.selectNode(view, node));
  }

  public draw(view: SVGSelection) {
    const node = view
      .selectAll<SVGGElement, Node>("g.node")
      .data((layer: Layer) => {
        if (layer.nodes) {
          return layer.nodes;
        }
        return [];
      }, (n: Node) => {
        return n.node_id;
      });

    const node_enter = node.enter()
      .append<SVGGElement>('g')
        .attr('class', 'node')
        .attr('node_id', (n: Node) => n.node_id)

    const merge = node.merge(node_enter);

    this.nodeWidget.draw(merge);

    node
      .exit()
        .remove();

    this.draggable.call(merge);
  }

  private selectNode(view: SVGSelection, node: Node) {
    return view.selectAll<SVGGElement, Node>(`g.node[node_id="${node.node_id}"]`);
  }

}
