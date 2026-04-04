import { Injectable } from '@angular/core';
import { select } from 'd3-selection';
import { line, curveBasis, curveCatmullRom, curveMonotoneX as curveMonotone } from 'd3-shape';
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
      case 'none':
        return null; // No curve interpolation
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

    // Ensure defs element exists
    let defs = view.select('defs');
    if (defs.empty()) {
      defs = view.append('defs');
    }

    // Select path elements for curves
    const drawing = view.selectAll('path.curve_element').data((d: MapDrawing) => {
      return d.element && d.element instanceof CurveElement ? [d] : [];
    });

    drawing.exit().remove();

    const drawing_enter = drawing.enter().append('path').attr('class', 'curve_element noselect');

    const merge = drawing.merge(drawing_enter);

    // Generate path data for each curve and set attributes
    merge.each(function (mapDrawing: MapDrawing) {
      const curve = mapDrawing.element as CurveElement;

      // Generate path data from points
      if (curve.points && curve.points.length > 0) {
        const points: [number, number][] = curve.points.map((p) => [p.x, p.y]);
        const curveInterpolator = self.getCurveInterpolator(curve.curve_type || 'catmullrom');

        let pathData = '';
        if (curveInterpolator === null) {
          // Direct line connection (no curve smoothing)
          pathData = `M ${points[0][0]} ${points[0][1]}`;
          for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i][0]} ${points[i][1]}`;
          }
        } else {
          // Use curve interpolation
          const lineGenerator = line<[number, number]>().curve(curveInterpolator);
          pathData = lineGenerator(points) || '';
        }

        // Create arrow markers if needed
        if (curve.arrow_end) {
          self.createOrUpdateArrowMarker(defs, mapDrawing.id, 'end', curve.stroke, curve.stroke_width);
        }
        if (curve.arrow_start) {
          self.createOrUpdateArrowMarker(defs, mapDrawing.id, 'start', curve.stroke, curve.stroke_width);
        }

        select(this)
          .attr('d', pathData)
          .attr('stroke', curve.stroke)
          .attr('stroke-width', curve.stroke_width)
          .attr('stroke-dasharray', self.qtDasharrayFixer.fix(curve.stroke_dasharray))
          .attr('fill', 'none')
          .attr('cursor', 'pointer')
          .attr('marker-end', curve.arrow_end ? 'url(#arrow-end-' + mapDrawing.id + ')' : null)
          .attr('marker-start', curve.arrow_start ? 'url(#arrow-start-' + mapDrawing.id + ')' : null);
      }
    });

    // Clean up old markers
    const activeDrawingIds = new Set(view.selectAll('path.curve_element').data().map((d) => d.id));

    defs.selectAll('marker[id^="arrow-"]').each(function() {
      const markerId = select(this).attr('id');
      if (!markerId) return;

      // Extract drawing ID from marker ID (e.g., "arrow-end-abc123" -> "abc123")
      const drawingId = markerId.replace(/^arrow-(start|end)-/, '');

      // Remove marker if drawing no longer exists or no longer has arrows
      if (!activeDrawingIds.has(drawingId)) {
        select(this).remove();
      }
    });
  }

  private createOrUpdateArrowMarker(
    defs: any,
    drawingId: string,
    position: 'start' | 'end',
    color: string,
    strokeWidth: number
  ) {
    const markerId = `arrow-${position}-${drawingId}`;
    let marker = defs.select(`marker#${markerId}`);

    if (marker.empty()) {
      marker = defs
        .append('marker')
        .attr('id', markerId)
        .attr('markerWidth', '4')
        .attr('markerHeight', '4')
        .attr('refX', position === 'end' ? '0' : '4')
        .attr('refY', '2')
        .attr('orient', 'auto')
        .attr('markerUnits', 'strokeWidth');

      marker
        .append('path')
        .attr('d', position === 'end' ? 'M0,0 L4,2 L0,4 z' : 'M4,0 L0,2 L4,4 z')
        .attr('fill', color);
    } else {
      marker.select('path').attr('fill', color);
    }
  }
}
