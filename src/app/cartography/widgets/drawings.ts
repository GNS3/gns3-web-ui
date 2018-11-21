import { Injectable, EventEmitter } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Layer } from "../models/layer";
import { SvgToDrawingConverter } from "../helpers/svg-to-drawing-converter";
import { Draggable, DraggableDrag, DraggableStart, DraggableEnd } from "../events/draggable";
import { DrawingWidget } from "./drawing";
import { drag, D3DragEvent } from "d3-drag";
import { event } from "d3-selection";
import { MapDrawing } from "../models/map/map-drawing";
import { Context } from "../models/context";
import { EllipseElement } from "../models/drawings/ellipse-element";
import { ResizingEnd } from "../events/resizing";


@Injectable()
export class DrawingsWidget implements Widget {
  public draggable = new Draggable<SVGGElement, MapDrawing>();
  public draggingEnabled = false;
  public resizingFinished = new EventEmitter<ResizingEnd<MapDrawing>>();

  // public onContextMenu = new EventEmitter<NodeContextMenu>();
  // public onDrawingClicked = new EventEmitter<NodeClicked>();
  // public onDrawingDragged = new EventEmitter<NodeDragged>();
  // public onDrawingDragging = new EventEmitter<NodeDragging>();
  
  constructor(
    private drawingWidget: DrawingWidget,
    private svgToDrawingConverter: SvgToDrawingConverter,
    private context: Context
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

    let bottom = drag()
      .on('start', (datum: MapDrawing) => {
        document.body.style.cursor = "ns-resize";
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;

        if (datum.element instanceof EllipseElement){
          (datum.element as EllipseElement).cy = (datum.element as EllipseElement).cy + evt.dy/2 < 0 ? 1 : (datum.element as EllipseElement).cy += evt.dy/2;
          (datum.element as EllipseElement).ry = (datum.element as EllipseElement).ry + evt.dy/2 < 0 ? 1 : (datum.element as EllipseElement).ry += evt.dy/2;
        }
        datum.element.height = (datum.element.height + evt.dy) < 0 ? 1: datum.element.height += evt.dy;
        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = "initial";

        const evt = new ResizingEnd<MapDrawing>();
        evt.x = datum.x;
        evt.y = datum. y;
        evt.width = datum.element.width;
        evt.height = datum.element.height;
        evt.datum = datum;

        this.resizingFinished.emit(evt);
      });

    let y: number;
    let dy: number;
    let top = drag()
      .on('start', () => {
        y = event.sourceEvent.clientY - this.context.getZeroZeroTransformationPoint().y;
        document.body.style.cursor = "ns-resize";
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;
        dy =  y - (evt.sourceEvent.clientY - this.context.getZeroZeroTransformationPoint().y);
        y = evt.sourceEvent.clientY - this.context.getZeroZeroTransformationPoint().y;
        
        if ((datum.element.height + dy) < 0){
          datum.element.height = 1;
        } else {
          datum.y = evt.sourceEvent.clientY - this.context.getZeroZeroTransformationPoint().y;
          datum.element.height += dy;
          if (datum.element instanceof EllipseElement) {
            (datum.element as EllipseElement).cy = (datum.element as EllipseElement).cy + dy/2 < 0 ? 1 : (datum.element as EllipseElement).cy += dy/2;
            (datum.element as EllipseElement).ry = (datum.element as EllipseElement).ry + dy/2 < 0 ? 1 : (datum.element as EllipseElement).ry += dy/2;
          }
        }
        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = "initial";
      });

    let x: number;
    let dx: number;
    let right = drag()
      .on('start', () => {
        x = event.sourceEvent.clientX - this.context.getZeroZeroTransformationPoint().x;
        document.body.style.cursor = "ew-resize";
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;
        dx = x - (evt.sourceEvent.clientX - this.context.getZeroZeroTransformationPoint().x);
        x = evt.sourceEvent.clientX - this.context.getZeroZeroTransformationPoint().x;

        if ((datum.element.width + dx) < 0){
          datum.element.width = 1;
        } else {
          datum.x = evt.sourceEvent.clientX - this.context.getZeroZeroTransformationPoint().x;
          datum.element.width += dx;
          if (datum.element instanceof EllipseElement) {
            (datum.element as EllipseElement).cx = (datum.element as EllipseElement).cx + dx/2 < 0 ? 1 : (datum.element as EllipseElement).cx += dx/2;
            (datum.element as EllipseElement).rx = (datum.element as EllipseElement).rx + dx/2 < 0 ? 1 : (datum.element as EllipseElement).rx += dx/2;
          }
        }
        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = "initial";
      });

    let left = drag()
      .on('start', () => {
        document.body.style.cursor = "ew-resize";
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;

        if (datum.element instanceof EllipseElement){
          (datum.element as EllipseElement).cx = (datum.element as EllipseElement).cx + evt.dx/2 < 0 ? 1 : (datum.element as EllipseElement).cx += evt.dx/2;
          (datum.element as EllipseElement).rx = (datum.element as EllipseElement).rx + evt.dx/2 < 0 ? 1 : (datum.element as EllipseElement).rx += evt.dx/2;
        }
        datum.element.width = (datum.element.width + evt.dx) < 0 ? 1 : datum.element.width += evt.dx;
        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = "initial";
      });

    merge
      .select<SVGAElement>('line.bottom')
      .call(bottom);

    merge
      .select<SVGAElement>('line.top')
      .call(top);

    merge
      .select<SVGAElement>('line.right')
      .call(right);

    merge
      .select<SVGAElement>('line.left')
      .call(left);
  }

  private selectDrawing(view: SVGSelection, drawing: MapDrawing) {
    return view.selectAll<SVGGElement, MapDrawing>(`g.drawing[drawing_id="${drawing.id}"]`);
  }
}
