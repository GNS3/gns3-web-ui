import { Context } from "../../../map/models/context";
import { Node } from "../models/node.model";
import { Link } from "../models/link.model";
import { NodesWidget } from "./nodes.widget";
import { Widget } from "./widget";
import { SVGSelection } from "../../../map/models/types";
import { LinksWidget } from "./links.widget";
import { D3ZoomEvent, zoom } from "d3-zoom";
import { event } from "d3-selection";
import { Drawing } from "../models/drawing.model";
import { DrawingsWidget } from "./drawings.widget";
import { DrawingLineWidget } from "./drawing-line.widget";

export class GraphLayout implements Widget {
  private nodes: Node[] = [];
  private links: Link[] = [];
  private drawings: Drawing[] = [];

  private linksWidget: LinksWidget;
  private nodesWidget: NodesWidget;
  private drawingsWidget: DrawingsWidget;
  private drawingLineTool: DrawingLineWidget;

  private centerZeroZeroPoint = true;

  constructor() {
    this.linksWidget = new LinksWidget();
    this.nodesWidget = new NodesWidget();
    this.drawingsWidget = new DrawingsWidget();
    this.drawingLineTool = new DrawingLineWidget();
  }

  public setNodes(nodes: Node[]) {
    this.nodes = nodes;
  }

  public setLinks(links: Link[]) {
    this.links = links;
  }

  public setDrawings(drawings: Drawing[]) {
    this.drawings = drawings;
  }

  public getNodesWidget() {
    return this.nodesWidget;
  }

  public getLinksWidget() {
    return this.linksWidget;
  }

  public getDrawingLineTool() {
    return this.drawingLineTool;
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

    this.linksWidget.draw(canvas, this.links);
    this.nodesWidget.draw(canvas, this.nodes);
    this.drawingsWidget.draw(canvas, this.drawings);
    this.drawingLineTool.connect(canvas);

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
