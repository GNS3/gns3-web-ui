import { Context } from "../../../map/models/context";
import { Node } from "../models/node.model";
import { Link } from "../models/link.model";
import { NodesWidget } from "./nodes.widget";
import { Widget } from "./widget";
import { SVGSelection } from "../../../map/models/types";
import { LinksWidget } from "./links.widget";
import { D3ZoomEvent, zoom } from "d3-zoom";
import { event } from "d3-selection";

export class GraphLayout implements Widget {

  private nodes: Node[] = [];
  private links: Link[] = [];

  private nodesWidget = new NodesWidget();
  private linksWidget = new LinksWidget();

  private centerZeroZeroPoint = true;

  public setNodes(nodes: Node[]) {
    this.nodes = nodes;
  }

  public setLinks(links: Link[]) {
    this.links = links;
  }


  draw(view: SVGSelection, context: Context) {
    const self = this;

    const drawing = view
      .selectAll<SVGGElement, Context>('g.drawing')
      .data([context]);

    const drawingEnter = drawing.enter()
        .append<SVGGElement>('g')
        .attr('class', 'drawing');

    if (this.centerZeroZeroPoint) {
      drawing.attr(
        'transform',
        (ctx: Context) => `translate(${ctx.getSize().width / 2}, ${ctx.getSize().height / 2})`);
    }

    const links = drawingEnter.append<SVGGElement>('g')
      .attr('class', 'links');

    const nodes = drawingEnter.append<SVGGElement>('g')
      .attr('class', 'nodes');

    this.linksWidget.draw(drawing, this.links);
    this.nodesWidget.draw(drawing, this.nodes);

    const onZoom = function(this: SVGSVGElement) {
      const e: D3ZoomEvent<SVGSVGElement, any> = event;
      if (self.centerZeroZeroPoint) {
        drawing.attr(
          'transform',
          `translate(${context.getSize().width / 2 + e.transform.x}, ` +
                `${context.getSize().height / 2 + e.transform.y}) scale(${e.transform.k})`);
      } else {
        drawing.attr('transform', e.transform.toString());
      }
    };

    view.call(zoom<SVGSVGElement, any>()
        .scaleExtent([1 / 2, 8])
        .on('zoom', onZoom));
  }

}
