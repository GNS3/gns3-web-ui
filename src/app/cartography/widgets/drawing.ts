import { Injectable } from '@angular/core';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { DrawingShapeWidget } from './drawings/drawing-shape-widget';
import { TextDrawingWidget } from './drawings/text-drawing';
import { ImageDrawingWidget } from './drawings/image-drawing';
import { RectDrawingWidget } from './drawings/rect-drawing';
import { LineDrawingWidget } from './drawings/line-drawing';
import { EllipseDrawingWidget } from './drawings/ellipse-drawing';
import { MapDrawing } from '../models/map/map-drawing';
import { SelectionManager } from '../managers/selection-manager';
import { LineElement } from '../models/drawings/line-element';
import { EllipseElement } from '../models/drawings/ellipse-element';

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
    const drawing_body = view.selectAll<SVGGElement, MapDrawing>('g.drawing_body').data((l: MapDrawing) => [l]);

    const drawing_body_enter = drawing_body
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'drawing_body');

    const drawing_body_merge = drawing_body.merge(drawing_body_enter).attr('transform', (d: MapDrawing) => {
      return `translate(${d.x},${d.y}) rotate(${d.rotation})`;
    });

    this.drawingWidgets.forEach(widget => {
      widget.draw(drawing_body_merge);
    });

    drawing_body_merge
      .select<SVGAElement>('line.top')
      .attr('stroke', 'transparent')
      .attr('stroke-width', '8px')
      .attr('x1', drawing =>
        drawing.element instanceof EllipseElement ? drawing.element.cx - drawing.element.width / 10 : '0'
      )
      .attr('x2', drawing =>
        drawing.element instanceof EllipseElement
          ? drawing.element.cx + drawing.element.width / 10
          : drawing.element.width
      )
      .attr('y1', '0')
      .attr('y2', '0')
      .attr('draggable', 'true')
      .attr('cursor', 'ns-resize');

    drawing_body_merge
      .select<SVGAElement>('line.bottom')
      .attr('stroke', 'transparent')
      .attr('stroke-width', '8px')
      .attr('x1', drawing =>
        drawing.element instanceof EllipseElement ? drawing.element.cx - drawing.element.width / 10 : '0'
      )
      .attr('x2', drawing =>
        drawing.element instanceof EllipseElement
          ? drawing.element.cx + drawing.element.width / 10
          : drawing.element.width
      )
      .attr('y1', drawing => drawing.element.height)
      .attr('y2', drawing => drawing.element.height)
      .attr('draggable', 'true')
      .attr('cursor', 'ns-resize');

    drawing_body_merge
      .select<SVGAElement>('line.right')
      .attr('stroke', 'transparent')
      .attr('stroke-width', '8px')
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', drawing =>
        drawing.element instanceof EllipseElement ? drawing.element.cy - drawing.element.height / 10 : '0'
      )
      .attr('y2', drawing =>
        drawing.element instanceof EllipseElement
          ? drawing.element.cy + drawing.element.height / 10
          : drawing.element.height
      )
      .attr('draggable', 'true')
      .attr('cursor', 'ew-resize');

    drawing_body_merge
      .select<SVGAElement>('line.left')
      .attr('stroke', 'transparent')
      .attr('stroke-width', '8px')
      .attr('x1', drawing => drawing.element.width)
      .attr('x2', drawing => drawing.element.width)
      .attr('y1', drawing =>
        drawing.element instanceof EllipseElement ? drawing.element.cy - drawing.element.height / 10 : '0'
      )
      .attr('y2', drawing =>
        drawing.element instanceof EllipseElement
          ? drawing.element.cy + drawing.element.height / 10
          : drawing.element.height
      )
      .attr('draggable', 'true')
      .attr('cursor', 'ew-resize');

    drawing_body_merge
      .select<SVGAElement>('circle.left')
      .attr('draggable', 'true')
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .attr('cx', drawing => (drawing.element as LineElement).x1)
      .attr('cy', drawing => (drawing.element as LineElement).y1)
      .attr('r', 10)
      .attr('cursor', 'move');

    drawing_body_merge
      .select<SVGAElement>('circle.right')
      .attr('draggable', 'true')
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .attr('cx', drawing => (drawing.element as LineElement).x2)
      .attr('cy', drawing => (drawing.element as LineElement).y2)
      .attr('r', 10)
      .attr('cursor', 'move');

    drawing_body_merge.classed('drawing_selected', (n: MapDrawing) => this.selectionManager.isSelected(n));
  }
}
