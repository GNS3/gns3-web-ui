import { Injectable } from '@angular/core';
import { QtDasharrayFixer } from '../../helpers/qt-dasharray-fixer';
import { EllipseElement } from '../../models/drawings/ellipse-element';
import { MapDrawing } from '../../models/map/map-drawing';
import { SVGSelection } from '../../models/types';
import { DrawingShapeWidget } from './drawing-shape-widget';

@Injectable()
export class EllipseDrawingWidget implements DrawingShapeWidget {
  constructor(private qtDasharrayFixer: QtDasharrayFixer) {}

  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGEllipseElement, EllipseElement>('ellipse.ellipse_element')
      .data((d: MapDrawing) => {
        return d.element && d.element instanceof EllipseElement ? [d.element] : [];
      });

    drawing.enter().append<SVGAElement>('line').attr('class', 'top');

    drawing.enter().append<SVGAElement>('line').attr('class', 'bottom');

    drawing.enter().append<SVGAElement>('line').attr('class', 'right');

    drawing.enter().append<SVGAElement>('line').attr('class', 'left');

    const drawing_enter = drawing
      .enter()
      .append<SVGEllipseElement>('ellipse')
      .attr('class', 'ellipse_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('fill', (ellipse) => ellipse.fill)
      .attr('fill-opacity', (ellipse) => ellipse.fill_opacity)
      .attr('stroke', (ellipse) => ellipse.stroke)
      .attr('stroke-width', (ellipse) => ellipse.stroke_width)
      .attr('stroke-dasharray', (ellipse) => this.qtDasharrayFixer.fix(ellipse.stroke_dasharray))
      .attr('cx', (ellipse) => ellipse.cx)
      .attr('cy', (ellipse) => ellipse.cy)
      .attr('rx', (ellipse) => ellipse.rx)
      .attr('ry', (ellipse) => ellipse.ry);

    drawing.exit().remove();
  }
}
