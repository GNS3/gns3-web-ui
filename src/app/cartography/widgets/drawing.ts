import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { DrawingShapeWidget } from "./drawings/drawing-shape-widget";
import { TextDrawingWidget } from "./drawings/text-drawing";
import { ImageDrawingWidget } from "./drawings/image-drawing";
import { RectDrawingWidget } from "./drawings/rect-drawing";
import { LineDrawingWidget } from "./drawings/line-drawing";
import { EllipseDrawingWidget } from "./drawings/ellipse-drawing";
import { MapDrawing } from "../models/map/map-drawing";
import { drag } from "d3-drag";
import { event } from "d3-selection";
import { SelectionManager } from "../managers/selection-manager";

@Injectable()
export class DrawingWidget implements Widget {
  private drawingWidgets: DrawingShapeWidget[] = [];
  
  constructor(
    private textDrawingWidget: TextDrawingWidget,
    private imageDrawingWidget: ImageDrawingWidget,
    private rectDrawingWidget: RectDrawingWidget,
    private lineDrawingWidget: LineDrawingWidget,
    private ellipseDrawingWidget: EllipseDrawingWidget,
    private selectionManager: SelectionManager
  ) {
    this.drawingWidgets = [
      this.textDrawingWidget,
      this.imageDrawingWidget,
      this.rectDrawingWidget,
      this.lineDrawingWidget,
      this.ellipseDrawingWidget
    ];
  }

  public draw(view: SVGSelection) {
    const drawing_body = view.selectAll<SVGGElement, MapDrawing>("g.drawing_body")
      .data((l:MapDrawing) => [l]);

    const drawing_body_enter = drawing_body.enter()
      .append<SVGGElement>('g')
        .attr("class", "drawing_body")
    
    drawing_body_enter
      .append<SVGAElement>('line')
        .attr("class", "top");

    drawing_body_enter
      .append<SVGAElement>('line')
        .attr("class", "bottom");

    drawing_body_enter
      .append<SVGAElement>('line')
        .attr("class", "right");

    drawing_body_enter
      .append<SVGAElement>('line')
        .attr("class", "left");

    const drawing_body_merge = drawing_body.merge(drawing_body_enter)
      .attr('transform', (d: MapDrawing) => {
        return `translate(${d.x},${d.y}) rotate(${d.rotation})`;
      });

    drawing_body_merge
      .select<SVGAElement>('line.top')
        .attr('stroke', 'transparent')
        .attr('stroke-width', '8px')
        // .attr('stroke-dashoffset', '0')
        // .attr('stroke-dasharray', '3')
        .attr('x1', '0')
        .attr('x2', (drawing) => drawing.element.width)
        .attr('y1', '0')
        .attr('y2', '0')
        .attr('draggable', 'true')
        .attr("cursor", "ns-resize");

    drawing_body_merge
      .select<SVGAElement>('line.bottom')
        .attr('stroke', 'transparent')
        .attr('stroke-width', '8px')
        // .attr('stroke-dashoffset', '0')
        // .attr('stroke-dasharray', '3')
        .attr('x1', '0')
        .attr('x2', (drawing) => drawing.element.width)
        .attr('y1', (drawing) => drawing.element.height)
        .attr('y2', (drawing) => drawing.element.height)
        .attr('draggable', 'true')
        .attr("cursor", "ns-resize");

    drawing_body_merge
      .select<SVGAElement>('line.right')
        .attr('stroke', 'transparent')
        .attr('stroke-width', '8px')
        // .attr('stroke-dashoffset', '0')
        // .attr('stroke-dasharray', '3')
        .attr('x1', '0')
        .attr('x2', '0')
        .attr('y1', '0')
        .attr('y2', (drawing) => drawing.element.height)
        .attr('draggable', 'true')
        .attr("cursor", "ew-resize");

    drawing_body_merge
      .select<SVGAElement>('line.left')
        .attr('stroke', 'transparent')
        .attr('stroke-width', '8px')
        // .attr('stroke-dashoffset', '0')
        // .attr('stroke-dasharray', '3')
        .attr('x1', (drawing) => drawing.element.width)
        .attr('x2', (drawing) => drawing.element.width)
        .attr('y1', '0')
        .attr('y2', (drawing) => drawing.element.height)
        .attr('draggable', 'true')
        .attr("cursor", "ew-resize");

    drawing_body_merge
      .classed('selected', (n: MapDrawing) => this.selectionManager.isSelected(n));
    
    this.drawingWidgets.forEach((widget) => {
      widget.draw(drawing_body_merge);
    });

  }
}
