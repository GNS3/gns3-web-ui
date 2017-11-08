import {Widget} from "./widget";
import {Node} from "../models/node.model";
import {SVGSelection} from "../../../map/models/types";
import {D3DragEvent} from "d3-drag";
import {select} from "d3-selection";


export class NodesWidget implements Widget {
  constructor() {}

  public draw(view: SVGSelection, nodes: Node[]) {
    const self = this;

    // function dragged(this: SVGElement, node: Node) {
    //   const element = this;
    //   const e: D3DragEvent<SVGGElement, Node, Node> = d3.event;
    //
    //   d3.select(this)
    //     .attr('transform', `translate(${e.x},${e.y})`);
    //
    //   node.x = e.x;
    //   node.y = e.y;
    // }

    const node = view.selectAll<SVGGElement, any>('g.node')
        .data(nodes);

    const node_enter = node.enter()
      .append<SVGGElement>('g')
      .attr('class', 'node');
      // .call(d3.drag<SVGGElement, Node>().on('drag', dragged))

    const node_image = node_enter.append<SVGImageElement>('image')
        .attr('xlink:href', (n: Node) => 'data:image/svg+xml;base64,' + btoa(n.icon.raw))
        .attr('width', (n: Node) => n.width)
        .attr('height', (n: Node) => n.height);

    node_enter.append<SVGCircleElement>('circle')
        .attr('class', 'node_point')
        .attr('r', 2);

    node_enter.append<SVGTextElement>('text')
      .attr('class', 'label');

    node_enter.append<SVGTextElement>('text')
      .attr('class', 'node_point_label')
      .attr('x', '-100')
      .attr('y', '0');

    const node_merge = node.merge(node_enter)
      .attr('transform', (n: Node) => {
        return `translate(${n.x},${n.y})`;
      });

    node_merge.select<SVGTextElement>('text.label')
      .attr('x', (n: Node) => n.label.x)
      .attr('y', (n: Node) => n.label.y)
      .attr('style', (n: Node) => n.label.style)
      .text((n: Node) => n.label.text);

    node_merge.select<SVGTextElement>('text.node_point_label')
      .text((n: Node) => `(${n.x}, ${n.y})`);

    node.exit().remove();
  }
}
