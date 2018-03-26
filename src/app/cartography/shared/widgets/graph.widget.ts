import { Context } from "../models/context";
import { Node } from "../models/node";
import { Link } from "../models/link";
import { NodesWidget } from "./nodes.widget";
import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { LinksWidget } from "./links.widget";
import { Drawing } from "../models/drawing";
import { DrawingsWidget } from "./drawings.widget";
import { DrawingLineWidget } from "./drawing-line.widget";
import {SelectionTool} from "../tools/selection-tool";
import {MovingTool} from "../tools/moving-tool";

export class GraphLayout implements Widget {
  private nodes: Node[] = [];
  private links: Link[] = [];
  private drawings: Drawing[] = [];

  private linksWidget: LinksWidget;
  private nodesWidget: NodesWidget;
  private drawingsWidget: DrawingsWidget;
  private drawingLineTool: DrawingLineWidget;
  private selectionTool: SelectionTool;
  private movingTool: MovingTool;

  private centerZeroZeroPoint = true;

  constructor() {
    this.linksWidget = new LinksWidget();
    this.nodesWidget = new NodesWidget();
    this.drawingsWidget = new DrawingsWidget();
    this.drawingLineTool = new DrawingLineWidget();
    this.selectionTool = new SelectionTool();
    this.movingTool = new MovingTool();
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

  public getMovingTool() {
    return this.movingTool;
  }

  public getSelectionTool() {
    return this.selectionTool;
  }

  connect(view: SVGSelection, context: Context) {
    this.drawingLineTool.connect(view, context);
    this.selectionTool.connect(view, context);
    this.movingTool.connect(view, context);

    this.selectionTool.activate();
  }

  draw(view: SVGSelection, context: Context) {
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

    this.drawingLineTool.draw(view, context);
    this.selectionTool.draw(view, context);
    this.movingTool.draw(view, context);
  }

  disconnect(view: SVGSelection) {
    if (view.empty && !view.empty()) {
      view.selectAll('*').remove();
    }
  }
}
