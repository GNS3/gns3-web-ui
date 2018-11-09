import { Context } from "../models/context";
import { NodesWidget } from "./nodes";
import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { DrawingLineWidget } from "./drawing-line";
import { SelectionTool } from "../tools/selection-tool";
import { MovingTool } from "../tools/moving-tool";
import { LayersWidget } from "./layers";
import { LayersManager } from "../managers/layers-manager";
import { Injectable } from "@angular/core";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";
import { MapDrawing } from "../models/map/map-drawing";


@Injectable()
export class GraphLayout implements Widget {
  private nodes: MapNode[] = [];
  private links: MapLink[] = [];
  private drawings: MapDrawing[] = [];

  constructor(
    private nodesWidget: NodesWidget,
    private drawingLineTool: DrawingLineWidget,
    private selectionTool: SelectionTool,
    private movingTool: MovingTool,
    private layersWidget: LayersWidget
  ) {
  }

  public setNodes(nodes: MapNode[]) {
    this.nodes = nodes;
  }

  public setLinks(links: MapLink[]) {
    this.links = links;
  }

  public getLinks() {
    return this.links;
  }

  public setDrawings(drawings: MapDrawing[]) {
    this.drawings = drawings;
  }

  public getNodesWidget() {
    return this.nodesWidget;
  }

  public getDrawingLineTool() {
    return this.drawingLineTool;
  }

  public getSelectionTool() {
    return this.selectionTool;
  }

  connect(view: SVGSelection, context: Context) {
    this.drawingLineTool.connect(view, context);
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
