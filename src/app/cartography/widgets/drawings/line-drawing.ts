import { Injectable } from '@angular/core';
import { select } from 'd3-selection';
import { line, curveBasis, curveCatmullRom, curveMonotone } from 'd3-shape';
import { QtDasharrayFixer } from '../../helpers/qt-dasharray-fixer';
import { CurveElement, CurveType } from '../../models/drawings/curve-element';
import { LineElement } from '../../models/drawings/line-element';
import { MapDrawing } from '../../models/map/map-drawing';
import { SVGSelection } from '../../models/types';
import { DrawingShapeWidget } from './drawing-shape-widget';

@Injectable()
export class LineDrawingWidget implements DrawingShapeWidget {
  constructor(private qtDasharrayFixer: QtDasharrayFixer) {}

  private getCurveInterpolator(curveType: CurveType) {
    switch (curveType) {
      case 'basis':
        return curveBasis;
      case 'catmullrom':
        return curveCatmullRom;
      case 'monotone':
        return curveMonotone;
      default:
        return curveCatmullRom;
    }
  }

  public draw(view: SVGSelection) {
    // Draw regular line elements
    this.drawLineElements(view);
    // Draw curve elements
    this.drawCurveElements(view);
  }

  private drawLineElements(view: SVGSelection) {
    const drawing = view.selectAll<SVGLineElement, LineElement>('line.line_element').data((d: MapDrawing) => {
      return d.element && d.element instanceof LineElement ? [d.element] : [];
    });

    drawing.enter().append<SVGCircleElement>('circle').attr('class', 'right');

    drawing.enter().append<SVGCircleElement>('circle').attr('class', 'left');

    const drawing_enter = drawing.enter().append<SVGLineElement>('line').attr('class', 'line_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('stroke', (line) => line.stroke)
      .attr('stroke-width', (line) => line.stroke_width)
      .attr('stroke-dasharray', (line) => this.qtDasharrayFixer.fix(line.stroke_dasharray))
      .attr('x1', (line) => line.x1)
      .attr('x2', (line) => line.x2)
      .attr('y1', (line) => line.y1)
      .attr('y2', (line) => line.y2)
      .attr('cursor', 'pointer');

    drawing.exit().remove();
  }

  private drawCurveElements(view: SVGSelection) {
    const self = this;

    // Select path elements for curves
    const drawing = view.selectAll<SVGPathElement, MapDrawing>('path.curve_element').data((d: MapDrawing) => {
      return d.element && d.element instanceof CurveElement ? [d] : [];
    });

    // Handle circle markers for curves (resize handles)
    const drawing_circles = view
      .selectAll<SVGCircleElement, MapDrawing>('circle.curve_handle')
      .data((d: MapDrawing) => {
        return d.element && d.element instanceof CurveElement ? d.element.points.map((p, i) => ({ point: p, index: i, drawing: d })) : [];
      });

    drawing_circles.exit().remove();

    const circleEnter = drawing_circles.enter().append<SVGCircleElement>('circle').attr('class', 'curve_handle');

    const circleMerge = drawing_circles.merge(circleEnter);

    circleMerge
      .attr('cx', (d) => d.point.x)
      .attr('cy', (d) => d.point.y)
      .attr('r', 4)
      .attr('fill', (d) => (d.drawing.element as CurveElement).stroke)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    drawing_circles.exit().remove();

    // Handle paths
    drawing.exit().remove();

    const drawing_enter = drawing.enter().append<SVGPathElement>('path').attr('class', 'curve_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge.each(function (mapDrawing: MapDrawing) {
      const curve = mapDrawing.element as CurveElement;

      // Generate path data from points
      if (curve.points && curve.points.length > 0) {
        const points: [number, number][] = curve.points.map((p) => [p.x, p.y]);
        const curveInterpolator = self.getCurveInterpolator(curve.curve_type || 'catmullrom');
        const lineGenerator = line<[number, number]>().curve(curveInterpolator);
        const pathData = lineGenerator(points) || '';

        select(this).attr('d', pathData);
      }
    });

    merge
      .attr('stroke', (mapDrawing) => (mapDrawing.element as CurveElement).stroke)
      .attr('stroke-width', (mapDrawing) => (mapDrawing.element as CurveElement).stroke_width)
      .attr('stroke-dasharray', (mapDrawing) => this.qtDasharrayFixer.fix((mapDrawing.element as CurveElement).stroke_dasharray))
      .attr('fill', 'none')
      .attr('cursor', 'pointer')
      .attr('marker-end', function (mapDrawing: MapDrawing) {
        const curve = mapDrawing.element as CurveElement;
        return curve.arrow_end ? 'url(#arrow-end-' + mapDrawing.id + ')' : null;
      })
      .attr('marker-start', function (mapDrawing: MapDrawing) {
        const curve = mapDrawing.element as CurveElement;
        return curve.arrow_start ? 'url(#arrow-start-' + mapDrawing.id + ')' : null;
      });
  }
}
