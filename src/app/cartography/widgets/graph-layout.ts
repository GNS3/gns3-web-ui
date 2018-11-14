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


@Injectable()
export class GraphLayout implements Widget {
  constructor(
    private nodesWidget: NodesWidget,
    private drawingLineTool: DrawingLineWidget,
    private selectionTool: SelectionTool,
    private movingTool: MovingTool,
    private layersWidget: LayersWidget,
    private layersManager: LayersManager
  ) {
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

    this.layersWidget.draw(canvas, this.layersManager.getLayersList());

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
