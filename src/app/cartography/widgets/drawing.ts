import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Drawing } from "../models/drawing";
import { DrawingShapeWidget } from "./drawings/drawing-shape-widget";
import { TextDrawingWidget } from "./drawings/text-drawing";
import { ImageDrawingWidget } from "./drawings/image-drawing";
import { RectDrawingWidget } from "./drawings/rect-drawing";
import { LineDrawingWidget } from "./drawings/line-drawing";
import { EllipseDrawingWidget } from "./drawings/ellipse-drawing";


@Injectable()
export class DrawingWidget implements Widget {
  private drawingWidgets: DrawingShapeWidget[] = [];
  
  constructor(
    private textDrawingWidget: TextDrawingWidget,
    private imageDrawingWidget: ImageDrawingWidget,
    private rectDrawingWidget: RectDrawingWidget,
    private lineDrawingWidget: LineDrawingWidget,
    private ellipseDrawingWidget: EllipseDrawingWidget
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
    const drawing_body = view.selectAll<SVGGElement, Drawing>("g.drawing_body")
      .data((l) => [l]);

    const drawing_body_enter = drawing_body.enter()
      .append<SVGGElement>('g')
      .attr("class", "drawing_body");

    const drawing_body_merge = drawing_body.merge(drawing_body_enter)
      .attr('transform', (d: Drawing) => {
        return `translate(${d.x},${d.y}) rotate(${d.rotation})`;
      });
  
    this.drawingWidgets.forEach((widget) => {
      widget.draw(drawing_body_merge);
    });

  }
}
