import { Injectable, EventEmitter } from "@angular/core";

import { Widget } from "./widget";
import { Drawing } from "../models/drawing";
import { SVGSelection } from "../models/types";
import { Layer } from "../models/layer";
import { TextDrawingWidget } from "./drawings/text-drawing";
import { SvgToDrawingConverter } from "../helpers/svg-to-drawing-converter";
import { ImageDrawingWidget } from "./drawings/image-drawing";
import { RectDrawingWidget } from "./drawings/rect-drawing";
import { LineDrawingWidget } from "./drawings/line-drawing";
import { EllipseDrawingWidget } from "./drawings/ellipse-drawing";
import { DrawingWidget } from "./drawings/drawing-widget";
import { event } from "d3-selection";
import { D3DragEvent, drag } from "d3-drag";
import { Draggable } from "../events/draggable";


@Injectable()
export class DrawingsWidget implements Widget {
  private drawingWidgets: DrawingWidget[] = [];

  public draggable = new Draggable<SVGGElement, Drawing>();

  // public onContextMenu = new EventEmitter<NodeContextMenu>();
  // public onDrawingClicked = new EventEmitter<NodeClicked>();
  // public onDrawingDragged = new EventEmitter<NodeDragged>();
  // public onDrawingDragging = new EventEmitter<NodeDragging>();
  
  constructor(
    private svgToDrawingConverter: SvgToDrawingConverter,
    private textDrawingWidget: TextDrawingWidget,
    private imageDrawingWidget: ImageDrawingWidget,
    private rectDrawingWidget: RectDrawingWidget,
    private lineDrawingWidget: LineDrawingWidget,
    private ellipseDrawingWidget: EllipseDrawingWidget
  ) {
    this.svgToDrawingConverter = new SvgToDrawingConverter();

    this.drawingWidgets = [
      this.textDrawingWidget,
      this.imageDrawingWidget,
      this.rectDrawingWidget,
      this.lineDrawingWidget,
      this.ellipseDrawingWidget
    ];
  }

  public draw(view: SVGSelection, drawings?: Drawing[]) {
    const drawing = view
      .selectAll<SVGGElement, Drawing>('g.drawing')
      .data((l: Layer) => {
        l.drawings.forEach((d: Drawing) => {
          try {
            d.element = this.svgToDrawingConverter.convert(d.svg);
          } catch (error) {
            console.log(`Cannot convert due to Error: '${error}'`);
          }
        });
        return l.drawings;
      }, (d: Drawing) => {
        return d.drawing_id;
      });

    const drawing_enter = drawing.enter()
      .append<SVGGElement>('g')
      .attr('class', 'drawing');

    const drawing_merge = drawing.merge(drawing_enter)
      .attr('transform', (d: Drawing) => {
        return `translate(${d.x},${d.y}) rotate(${d.rotation})`;
      });

    this.drawingWidgets.forEach((widget) => {
      widget.draw(drawing_merge);
    });

    drawing
      .exit()
        .remove();

    this.draggable.call(drawing_merge);
  }
}
