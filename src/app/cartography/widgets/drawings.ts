import { EventEmitter, Injectable } from '@angular/core';
import { drag } from 'd3-drag';
import { event } from 'd3-selection';
import { Draggable } from '../events/draggable';
import { DrawingContextMenu } from '../events/event-source';
import { ResizingEnd } from '../events/resizing';
import { SvgToDrawingConverter } from '../helpers/svg-to-drawing-converter';
import { MapSettingsManager } from '../managers/map-settings-manager';
import { Context } from '../models/context';
import { EllipseElement } from '../models/drawings/ellipse-element';
import { LineElement } from '../models/drawings/line-element';
import { Layer } from '../models/layer';
import { MapDrawing } from '../models/map/map-drawing';
import { SVGSelection } from '../models/types';
import { DrawingWidget } from './drawing';
import { Widget } from './widget';

@Injectable()
export class DrawingsWidget implements Widget {
  public draggable = new Draggable<SVGGElement, MapDrawing>();
  public draggingEnabled = false;
  public resizingFinished = new EventEmitter<ResizingEnd<MapDrawing>>();
  public onContextMenu = new EventEmitter<DrawingContextMenu>();

  // public onContextMenu = new EventEmitter<NodeContextMenu>();
  // public onDrawingClicked = new EventEmitter<NodeClicked>();
  // public onDrawingDragged = new EventEmitter<NodeDragged>();
  // public onDrawingDragging = new EventEmitter<NodeDragging>();

  constructor(
    private drawingWidget: DrawingWidget,
    private svgToDrawingConverter: SvgToDrawingConverter,
    private context: Context,
    private mapSettings: MapSettingsManager
  ) {
    this.svgToDrawingConverter = new SvgToDrawingConverter();
  }

  public redrawDrawing(view: SVGSelection, drawing: MapDrawing) {
    this.drawingWidget.draw(this.selectDrawing(view, drawing));
  }

  public draw(view: SVGSelection) {
    const drawing = view.selectAll<SVGGElement, MapDrawing>('g.drawing').data(
      (layer: Layer) => {
        layer.drawings.forEach((d: MapDrawing) => {
          try {
            d.element = this.svgToDrawingConverter.convert(d.svg);
          } catch (error) {
            console.log(`Cannot convert due to Error: '${error}'`);
          }
        });
        return layer.drawings;
      },
      (l: MapDrawing) => {
        return l.id;
      }
    );

    const drawing_enter = drawing
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'drawing')
      .attr('drawing_id', (l: MapDrawing) => l.id)
      .on('contextmenu', (l: MapDrawing) => {
        event.preventDefault();
        this.onContextMenu.emit(new DrawingContextMenu(event, l));
      });

    const merge = drawing.merge(drawing_enter);

    this.drawingWidget.draw(merge);

    drawing.exit().remove();

    if (!this.mapSettings.isReadOnly) {
      this.draggable.call(merge);
    }

    let y: number;
    let dy: number;
    let topEdge: number;
    let bottomEdge: number;
    let isReflectedVertical: boolean = false;
    let bottom = drag()
      .on('start', (datum: MapDrawing) => {
        document.body.style.cursor = 'ns-resize';
        topEdge = datum.y;
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;

        if (!isReflectedVertical) {
          if (datum.element.height + evt.dy < 0) {
            isReflectedVertical = true;
            y = topEdge;
            datum.element.height = Math.abs(datum.element.height + evt.dy);
          } else {
            datum.element.height += evt.dy;

            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cy =
                (datum.element as EllipseElement).cy + evt.dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cy += evt.dy / 2);
              (datum.element as EllipseElement).ry =
                (datum.element as EllipseElement).ry + evt.dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).ry += evt.dy / 2);
            }
          }
        } else {
          dy =
            y -
            (evt.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y));
          y = evt.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y);

          if (datum.element.height + dy < 0) {
            isReflectedVertical = false;
            y = topEdge;
            datum.element.height = Math.abs(datum.element.height + evt.dy);
          } else {
            datum.y =
              evt.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y);
            datum.element.height += dy;
            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cy =
                (datum.element as EllipseElement).cy + dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cy += dy / 2);
              (datum.element as EllipseElement).ry =
                (datum.element as EllipseElement).ry + dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).ry += dy / 2);
            }
          }
        }

        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = 'initial';
        this.resizingFinished.emit(this.createResizingEvent(datum));
      });

    let top = drag()
      .on('start', (datum: MapDrawing) => {
        y = event.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y);
        bottomEdge = y + datum.element.height;
        document.body.style.cursor = 'ns-resize';
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;

        if (!isReflectedVertical) {
          dy =
            y -
            (evt.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y));
          y = evt.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y);

          if (datum.element.height + dy < 0) {
            y = bottomEdge;
            isReflectedVertical = true;
            datum.element.height = Math.abs(datum.element.height + evt.dy);
          } else {
            datum.y =
              evt.sourceEvent.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y);
            datum.element.height += dy;
            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cy =
                (datum.element as EllipseElement).cy + dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cy += dy / 2);
              (datum.element as EllipseElement).ry =
                (datum.element as EllipseElement).ry + dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).ry += dy / 2);
            }
          }
        } else {
          if (datum.element.height + evt.dy < 0) {
            isReflectedVertical = false;
            y = bottomEdge;
            datum.element.height = Math.abs(datum.element.height + evt.dy);
          } else {
            datum.element.height += evt.dy;

            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cy =
                (datum.element as EllipseElement).cy + evt.dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cy += evt.dy / 2);
              (datum.element as EllipseElement).ry =
                (datum.element as EllipseElement).ry + evt.dy / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).ry += evt.dy / 2);
            }
          }
        }

        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = 'initial';
        this.resizingFinished.emit(this.createResizingEvent(datum));
      });

    let x: number;
    let dx: number;
    let rightEdge: number;
    let leftEdge: number;
    let isReflectedHorizontal: boolean = false;
    let right = drag()
      .on('start', (datum: MapDrawing) => {
        x = event.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x);
        leftEdge = x + datum.element.width;
        document.body.style.cursor = 'ew-resize';
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;

        if (!isReflectedHorizontal) {
          dx =
            x -
            (evt.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x));
          x = evt.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x);

          if (datum.element.width + dx < 0) {
            x = leftEdge;
            isReflectedHorizontal = true;
            datum.element.width = Math.abs(datum.element.width + evt.dx);
          } else {
            datum.x =
              evt.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x);
            datum.element.width += dx;
            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cx =
                (datum.element as EllipseElement).cx + dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cx += dx / 2);
              (datum.element as EllipseElement).rx =
                (datum.element as EllipseElement).rx + dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).rx += dx / 2);
            }
          }
        } else {
          if (datum.element.width + evt.dx < 0) {
            x = leftEdge;
            isReflectedHorizontal = false;
            datum.element.width = Math.abs(datum.element.width + evt.dx);
          } else {
            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cx =
                (datum.element as EllipseElement).cx + evt.dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cx += evt.dx / 2);
              (datum.element as EllipseElement).rx =
                (datum.element as EllipseElement).rx + evt.dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).rx += evt.dx / 2);
            }
            datum.element.width = datum.element.width + evt.dx < 0 ? 1 : (datum.element.width += evt.dx);
          }
        }

        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = 'initial';
        this.resizingFinished.emit(this.createResizingEvent(datum));
      });

    let left = drag()
      .on('start', (datum: MapDrawing) => {
        document.body.style.cursor = 'ew-resize';
        rightEdge = datum.x;
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;

        if (!isReflectedHorizontal) {
          if (datum.element.width + evt.dx < 0) {
            x = rightEdge;
            isReflectedHorizontal = true;
            datum.element.width = Math.abs(datum.element.width + evt.dx);
          } else {
            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cx =
                (datum.element as EllipseElement).cx + evt.dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cx += evt.dx / 2);
              (datum.element as EllipseElement).rx =
                (datum.element as EllipseElement).rx + evt.dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).rx += evt.dx / 2);
            }
            datum.element.width = datum.element.width + evt.dx < 0 ? 1 : (datum.element.width += evt.dx);
          }
        } else {
          dx =
            x -
            (evt.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x));
          x = evt.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x);

          if (datum.element.width + dx < 0) {
            x = rightEdge;
            isReflectedHorizontal = false;
            datum.element.width = Math.abs(datum.element.width + evt.dx);
          } else {
            datum.x =
              evt.sourceEvent.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x);
            datum.element.width += dx;
            if (datum.element instanceof EllipseElement) {
              (datum.element as EllipseElement).cx =
                (datum.element as EllipseElement).cx + dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).cx += dx / 2);
              (datum.element as EllipseElement).rx =
                (datum.element as EllipseElement).rx + dx / 2 < 0
                  ? 1
                  : ((datum.element as EllipseElement).rx += dx / 2);
            }
          }
        }

        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = 'initial';
        this.resizingFinished.emit(this.createResizingEvent(datum));
      });

    let circleMoveRight = drag()
      .on('start', () => {
        document.body.style.cursor = 'move';
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;
        datum.element.width += evt.dx;
        datum.element.height += evt.dy;
        (datum.element as LineElement).x2 += evt.dx;
        (datum.element as LineElement).y2 += evt.dy;
        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = 'initial';
        this.resizingFinished.emit(this.createResizingEvent(datum));
      });

    let circleMoveLeft = drag()
      .on('start', () => {
        document.body.style.cursor = 'move';
      })
      .on('drag', (datum: MapDrawing) => {
        const evt = event;
        datum.element.width += evt.dx;
        datum.element.height += evt.dy;
        (datum.element as LineElement).x1 += evt.dx;
        (datum.element as LineElement).y1 += evt.dy;
        this.redrawDrawing(view, datum);
      })
      .on('end', (datum: MapDrawing) => {
        document.body.style.cursor = 'initial';
        this.resizingFinished.emit(this.createResizingEvent(datum));
      });

    merge.select<SVGAElement>('line.bottom').call(bottom);

    merge.select<SVGAElement>('line.top').call(top);

    merge.select<SVGAElement>('line.right').call(right);

    merge.select<SVGAElement>('line.left').call(left);

    merge.select<SVGAElement>('circle.right').call(circleMoveRight);

    merge.select<SVGAElement>('circle.left').call(circleMoveLeft);
  }

  private createResizingEvent(datum: MapDrawing) {
    const evt = new ResizingEnd<MapDrawing>();
    evt.x = datum.x;
    evt.y = datum.y;
    evt.width = datum.element.width;
    evt.height = datum.element.height;
    evt.datum = datum;
    return evt;
  }

  private selectDrawing(view: SVGSelection, drawing: MapDrawing) {
    return view.selectAll<SVGGElement, MapDrawing>(`g.drawing[drawing_id="${drawing.id}"]`);
  }
}
