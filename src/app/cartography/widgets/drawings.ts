import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { Drawing } from "../models/drawing";
import { SVGSelection } from "../models/types";
import { Layer } from "../models/layer";
import { SvgToDrawingConverter } from "../helpers/svg-to-drawing-converter";
import { Draggable } from "../events/draggable";
import { DrawingWidget } from "./drawing";


@Injectable()
export class DrawingsWidget implements Widget {
  public draggable = new Draggable<SVGGElement, Drawing>();

  // public onContextMenu = new EventEmitter<NodeContextMenu>();
  // public onDrawingClicked = new EventEmitter<NodeClicked>();
  // public onDrawingDragged = new EventEmitter<NodeDragged>();
  // public onDrawingDragging = new EventEmitter<NodeDragging>();
  
  constructor(
    private drawingWidget: DrawingWidget,
    private svgToDrawingConverter: SvgToDrawingConverter,
  ) {
    this.svgToDrawingConverter = new SvgToDrawingConverter();
  }

  public redrawDrawing(view: SVGSelection, drawing: Drawing) {
    this.drawingWidget.draw(this.selectDrawing(view, drawing));
  }

  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGGElement, Drawing>("g.drawing")
      .data((layer: Layer) => {
        layer.drawings.forEach((d: Drawing) => {
          try {
            d.element = this.svgToDrawingConverter.convert(d.svg);
          } catch (error) {
            console.log(`Cannot convert due to Error: '${error}'`);
          }
        });
        return layer.drawings;
      }, (l: Drawing) => {
        return l.drawing_id;
      });

    const drawing_enter = drawing.enter()
      .append<SVGGElement>('g')
        .attr('class', 'drawing')
        .attr('drawing_id', (l: Drawing) => l.drawing_id)

    const merge = drawing.merge(drawing_enter);

    this.drawingWidget.draw(merge);

    drawing
      .exit()
        .remove();

    this.draggable.call(merge);
  }

  private selectDrawing(view: SVGSelection, drawing: Drawing) {
    return view.selectAll<SVGGElement, Drawing>(`g.drawing[drawing_id="${drawing.drawing_id}"]`);
  }
}
