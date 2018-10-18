import { Context } from "../models/context";
import { Node } from "../models/node";
import { Link } from "../../models/link";
import { NodesWidget } from "./nodes";
import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { LinksWidget } from "./links";
import { Drawing } from "../models/drawing";
import { DrawingsWidget } from "./drawings";
import { DrawingLineWidget } from "./drawing-line";
import { SelectionTool } from "../tools/selection-tool";
import { MovingTool } from "../tools/moving-tool";
import { LayersWidget } from "./layers";
import { LayersManager } from "../managers/layers-manager";


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
  private layersWidget: LayersWidget;

  constructor() {
    this.linksWidget = new LinksWidget();
    this.nodesWidget = new NodesWidget();
    this.drawingsWidget = new DrawingsWidget();
    this.drawingLineTool = new DrawingLineWidget();
    this.selectionTool = new SelectionTool();
    this.movingTool = new MovingTool();
    this.layersWidget = new LayersWidget();
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

  public getDrawingsWidget() {
    return this.drawingsWidget;
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
    view
      .attr('width', context.size.width)
      .attr('height', context.size.height);

    const canvas = view
      .selectAll<SVGGElement, Context>('g.canvas')
      .data([context]);

    const canvasEnter = canvas.enter()
      .append<SVGGElement>('g')
      .attr('class', 'canvas');

    canvas
      .merge(canvasEnter)
      .attr(
      'transform',
      (ctx: Context) => {
        const xTrans = ctx.getZeroZeroTransformationPoint().x + ctx.transformation.x;
        const yTrans = ctx.getZeroZeroTransformationPoint().y + ctx.transformation.y;
        const kTrans = ctx.transformation.k;
        return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
      });

    // @fix me
    const layersManager = new LayersManager();
    layersManager.setNodes(this.nodes);
    layersManager.setDrawings(this.drawings);
    layersManager.setLinks(this.links);

    this.layersWidget.graphLayout = this;
    this.layersWidget.draw(canvas, layersManager.getLayersList());

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
