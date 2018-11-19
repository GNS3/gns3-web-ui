import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Layer } from "../models/layer";
import { SvgToDrawingConverter } from "../helpers/svg-to-drawing-converter";
import { Draggable } from "../events/draggable";
import { DrawingWidget } from "./drawing";
import { MapDrawing } from "../models/map/map-drawing";


@Injectable()
export class DrawingsWidget implements Widget {
  public draggable = new Draggable<SVGGElement, MapDrawing>();
  public draggingEnabled = false;

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

  public redrawDrawing(view: SVGSelection, drawing: MapDrawing) {
    this.drawingWidget.draw(this.selectDrawing(view, drawing));
  }

  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGGElement, MapDrawing>("g.drawing")
      .data((layer: Layer) => {
        layer.drawings.forEach((d: MapDrawing) => {
          try {
            d.element = this.svgToDrawingConverter.convert(d.svg);
          } catch (error) {
            console.log(`Cannot convert due to Error: '${error}'`);
          }
        });
        return layer.drawings;
      }, (l: MapDrawing) => {
        return l.id;
      });

    const drawing_enter = drawing.enter()
      .append<SVGGElement>('g')
        .attr('class', 'drawing')
        .attr('drawing_id', (l: MapDrawing) => l.id)

    const merge = drawing.merge(drawing_enter);

    this.drawingWidget.draw(merge);

    drawing
      .exit()
        .remove();

    if (this.draggingEnabled) {
      this.draggable.call(merge);
    }
  }

  private selectDrawing(view: SVGSelection, drawing: MapDrawing) {
    return view.selectAll<SVGGElement, MapDrawing>(`g.drawing[drawing_id="${drawing.id}"]`);
  }
}
