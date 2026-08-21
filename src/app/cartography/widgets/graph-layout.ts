import * as d3 from 'd3';
import { Injectable } from '@angular/core';
import { SelectionManager } from '../managers/selection-manager';
import { LayersManager } from '../managers/layers-manager';
import { Context } from '../models/context';
import { SVGSelection } from '../models/types';
import { MovingTool } from '../tools/moving-tool';
import { SelectionTool } from '../tools/selection-tool';
import { DrawingLineWidget } from './drawing-line';
import { LayersWidget } from './layers';
import { NodesWidget } from './nodes';
import { Widget } from './widget';
import { CurveElement } from '../models/drawings/curve-element';
import { MapDrawing } from '../models/map/map-drawing';
import { MapLabel } from '../models/map/map-label';
import { MapNode } from '../models/map/map-node';

@Injectable()
export class GraphLayout implements Widget {
  constructor(
    private nodesWidget: NodesWidget,
    private drawingLineTool: DrawingLineWidget,
    private selectionTool: SelectionTool,
    private movingTool: MovingTool,
    private layersWidget: LayersWidget,
    private layersManager: LayersManager,
    private selectionManager: SelectionManager
  ) {}

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

  /**
   * Canonical canvas transform: origin anchor + user pan + scale. Everything
   * that (re)applies the g.canvas transform must go through here so pan/zoom
   * semantics stay in one place (d3-map's scale-change handler calls it too).
   */
  public canvasTransform(ctx: Context): string {
    const xTrans = ctx.getZeroZeroTransformationPoint().x + ctx.transformation.x;
    const yTrans = ctx.getZeroZeroTransformationPoint().y + ctx.transformation.y;
    const kTrans = ctx.transformation.k;
    return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
  }

  draw(view: SVGSelection, context: Context) {
    view.attr('width', context.size.width).attr('height', context.size.height);

    const canvas = view.selectAll<SVGGElement, Context>('g.canvas').data([context]);

    const canvasEnter = canvas.enter().append<SVGGElement>('g').attr('class', 'canvas');

    canvas.merge(canvasEnter).attr('transform', (ctx: Context) => this.canvasTransform(ctx));

    this.layersWidget.draw(canvas, this.layersManager.getLayersList());

    this.drawingLineTool.draw(view, context);
    this.selectionTool.draw(view, context);
    this.movingTool.draw(view, context);
  }

  public updateSelectionHighlights(view: SVGSelection) {
    const canvas = view.select<SVGGElement>('g.canvas');
    const defs = view.select('defs');

    canvas.selectAll<SVGGElement, any>('g.node_body').classed('selected', (n) => this.selectionManager.isSelected(n));
    canvas.selectAll<SVGGElement, any>('g.link_body').classed('selected', (l) => this.selectionManager.isSelected(l));

    const selectedNodeIds = new Set(
      this.selectionManager
        .getSelected()
        .filter((item): item is MapNode => item instanceof MapNode)
        .map((node) => node.id)
    );
    canvas
      .selectAll<SVGRectElement, MapLabel>('rect.label_selection')
      .attr('visibility', (label) =>
        this.selectionManager.isSelected(label) || selectedNodeIds.has(label.nodeId) ? 'visible' : 'hidden'
      );

    const drawingBodies = canvas.selectAll<SVGGElement, MapDrawing>('g.drawing_body');
    drawingBodies.classed('drawing_selected', (d) => this.selectionManager.isSelected(d));

    // Update curve selection state and arrow colors
    const errorColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--mat-sys-error')
      .trim();

    drawingBodies.each(function (drawing: MapDrawing, index, elements) {
      const groupElement = elements[index];
      const isSelected = drawing.element && this.selectionManager.isSelected(drawing);
      const group = d3.select(groupElement);

      // Update curve path selection state
      group.selectAll<SVGPathElement, any>('path.curve_element').classed('selected', () => this.selectionManager.isSelected(drawing));

      // Update arrow marker colors based on selection state
      if (drawing.element instanceof CurveElement) {
        const curve = drawing.element as CurveElement;
        const originalColor = curve.stroke || getComputedStyle(document.documentElement)
          .getPropertyValue('--gns3-canvas-link-color')
          .trim();
        const isCurveSelected = this.selectionManager.isSelected(drawing);

        // Update arrow markers for this curve
        if (curve.arrow_end) {
          const endMarker = defs.select(`#arrow-end-${drawing.id} path`);
          if (!endMarker.empty()) {
            endMarker.attr('fill', isCurveSelected ? errorColor : originalColor);
          }
        }
        if (curve.arrow_start) {
          const startMarker = defs.select(`#arrow-start-${drawing.id} path`);
          if (!startMarker.empty()) {
            startMarker.attr('fill', isCurveSelected ? errorColor : originalColor);
          }
        }
      }
    }.bind(this));
  }

  disconnect(view: SVGSelection) {
    if (view.empty && !view.empty()) {
      view.selectAll('*').remove();
    }
  }
}
