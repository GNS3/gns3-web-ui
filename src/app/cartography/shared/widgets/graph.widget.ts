import { Context } from "../../../map/models/context";
import { Node } from "../models/node.model";
import { Link } from "../models/link.model";
import { NodesWidget } from "./nodes.widget";
import { Widget } from "./widget";
import { SVGSelection } from "../../../map/models/types";
import { LinksWidget } from "./links.widget";
import { D3ZoomEvent, zoom } from "d3-zoom";
import { event } from "d3-selection";
import {Drawing} from "../models/drawing.model";
import {DrawingsWidget} from "./drawings.widget";

export class GraphLayout implements Widget {

  private nodes: Node[] = [];
  private links: Link[] = [];
  private drawings: Drawing[] = [];

  private nodesWidget = new NodesWidget();
  private linksWidget = new LinksWidget();
  private drawingsWidget = new DrawingsWidget();

  private centerZeroZeroPoint = true;

  public setNodes(nodes: Node[]) {
    this.nodes = nodes;
  }

  public setLinks(links: Link[]) {
    this.links = links;
  }

  public setDrawings(drawings: Drawing[]) {
    this.drawings = drawings;
  }

  draw(view: SVGSelection, context: Context) {
    const self = this;

    const canvas = view
      .selectAll<SVGGElement, Context>('g.canvas')
      .data([context]);

    const canvasEnter = canvas.enter()
        .append<SVGGElement>('g')
        .attr('class', 'canvas');

    if (this.centerZeroZeroPoint) {
      canvas.attr(
        'transform',
        (ctx: Context) => `translate(${ctx.getSize().width / 2}, ${ctx.getSize().height / 2})`);
    }

    // const links = canvasEnter.append<SVGGElement>('g')
    //   .attr('class', 'links');
    //
    // const nodes = canvasEnter.append<SVGGElement>('g')
    //   .attr('class', 'nodes');

    this.linksWidget.draw(canvas, this.links);
    this.nodesWidget.draw(canvas, this.nodes);
    this.drawingsWidget.draw(canvas, this.drawings)

    const onZoom = function(this: SVGSVGElement) {
      const e: D3ZoomEvent<SVGSVGElement, any> = event;
      if (self.centerZeroZeroPoint) {
        canvas.attr(
          'transform',
          `translate(${context.getSize().width / 2 + e.transform.x}, ` +
                `${context.getSize().height / 2 + e.transform.y}) scale(${e.transform.k})`);
      } else {
        canvas.attr('transform', e.transform.toString());
      }
    };

    view.call(zoom<SVGSVGElement, any>()
        .scaleExtent([1 / 2, 8])
        .on('zoom', onZoom));
  }

}
