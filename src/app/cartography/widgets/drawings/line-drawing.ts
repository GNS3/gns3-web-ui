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
    const self = this;

    // Ensure defs element exists for arrow markers
    let defs = view.select('defs');
    if (defs.empty()) {
      defs = view.append('defs');
    }

    const drawing = view.selectAll<SVGLineElement, LineElement>('line.line_element').data((d: MapDrawing) => {
      return d.element && d.element instanceof LineElement ? [d.element] : [];
    });

    drawing.enter().append<SVGCircleElement>('circle').attr('class', 'right');

    drawing.enter().append<SVGCircleElement>('circle').attr('class', 'left');

    // Add control point circle for freeform mode
    drawing.enter().append<SVGCircleElement>('circle').attr('class', 'control-point');

    const drawing_enter = drawing.enter().append<SVGLineElement>('line').attr('class', 'line_element noselect');

    const merge = drawing.merge(drawing_enter);

    // Store original stroke color for hover effect
    merge.each(function (line: LineElement) {
      const originalStroke = line.stroke;

      // Create arrow markers if needed
      if (line.arrow_end) {
        self.createOrUpdateArrowMarkerForLine(defs, 'end', line.stroke, line.stroke_width);
      }
      if (line.arrow_start) {
        self.createOrUpdateArrowMarkerForLine(defs, 'start', line.stroke, line.stroke_width);
      }

      select(this)
        .attr('stroke', line.stroke)
        .attr('stroke-width', line.stroke_width)
        .attr('stroke-dasharray', self.qtDasharrayFixer.fix(line.stroke_dasharray))
        .attr('x1', line.x1)
        .attr('x2', line.x2)
        .attr('y1', line.y1)
        .attr('y2', line.y2)
        .attr('cursor', 'pointer')
        .attr('marker-end', line.arrow_end ? 'url(#line-end)' : null)
        .attr('marker-start', line.arrow_start ? 'url(#line-start)' : null)
        .on('mouseenter', function () {
          // Get the error color from CSS variable
          const errorColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--mat-sys-error')
            .trim();

          // Update path stroke
          select(this).attr('stroke', errorColor);

          // Update arrow marker fills
          if (line.arrow_end) {
            defs.select('#line-end path').attr('fill', errorColor);
          }
          if (line.arrow_start) {
            defs.select('#line-start path').attr('fill', errorColor);
          }
        })
        .on('mouseleave', function () {
          // Restore original stroke
          select(this).attr('stroke', originalStroke);

          // Restore arrow marker fills
          if (line.arrow_end) {
            defs.select('#line-end path').attr('fill', originalStroke);
          }
          if (line.arrow_start) {
            defs.select('#line-start path').attr('fill', originalStroke);
          }
        });
    });

    // Update control point for freeform lines
    merge
      .selectAll<SVGCircleElement, LineElement>('circle.control-point')
      .attr('cx', (line) => {
        if (line.drawing_type === 'freeform' && line.control_offset) {
          const midX = (line.x1 + line.x2) / 2;
          return midX + line.control_offset[0];
        }
        return (line.x1 + line.x2) / 2;
      })
      .attr('cy', (line) => {
        if (line.drawing_type === 'freeform' && line.control_offset) {
          const midY = (line.y1 + line.y2) / 2;
          return midY + line.control_offset[1];
        }
        return (line.y1 + line.y2) / 2;
      })
      .attr('r', (line) => (line.drawing_type === 'freeform' ? 5 : 0))
      .attr('fill', 'var(--mat-sys-primary)')
      .attr('stroke', 'var(--mat-sys-on-primary)')
      .attr('stroke-width', 2)
      .attr('cursor', 'move')
      .attr('display', (line) => (line.drawing_type === 'freeform' ? 'block' : 'none'));

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

        // Store original stroke color for hover effect
        const originalStroke = curve.stroke;

        select(this)
          .attr('d', pathData)
          .attr('stroke', curve.stroke)
          .attr('stroke-width', curve.stroke_width)
          .attr('stroke-dasharray', self.qtDasharrayFixer.fix(curve.stroke_dasharray))
          .attr('fill', 'none')
          .attr('cursor', 'pointer')
          .attr('marker-end', curve.arrow_end ? 'url(#arrow-end-' + mapDrawing.id + ')' : null)
          .attr('marker-start', curve.arrow_start ? 'url(#arrow-start-' + mapDrawing.id + ')' : null)
          .on('mouseenter', function () {
            // Get the error color from CSS variable
            const errorColor = getComputedStyle(document.documentElement)
              .getPropertyValue('--mat-sys-error')
              .trim();

            // Update path stroke
            select(this).attr('stroke', errorColor);

            // Update arrow marker fills
            if (curve.arrow_end) {
              defs.select(`#arrow-end-${mapDrawing.id} path`).attr('fill', errorColor);
            }
            if (curve.arrow_start) {
              defs.select(`#arrow-start-${mapDrawing.id} path`).attr('fill', errorColor);
            }
          })
          .on('mouseleave', function () {
            // Restore original stroke
            select(this).attr('stroke', originalStroke);

            // Restore arrow marker fills
            if (curve.arrow_end) {
              defs.select(`#arrow-end-${mapDrawing.id} path`).attr('fill', originalStroke);
            }
            if (curve.arrow_start) {
              defs.select(`#arrow-start-${mapDrawing.id} path`).attr('fill', originalStroke);
            }
          });
      }
    });

    // Clean up old markers
    const activeDrawingIds = new Set(view.selectAll('path.curve_element').data().map((d: MapDrawing) => d.id));

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

  private createOrUpdateArrowMarkerForLine(
    defs: any,
    position: 'start' | 'end',
    color: string,
    strokeWidth: number
  ) {
    const markerId = `line-${position}`;
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
