import { Injectable } from '@angular/core';
import { MapSettingsService } from '@services/mapsettings.service';
import { SelectionManager } from '../managers/selection-manager';
import { EllipseElement } from '../models/drawings/ellipse-element';
import { ImageElement } from '../models/drawings/image-element';
import { LineElement } from '../models/drawings/line-element';
import { RectElement } from '../models/drawings/rect-element';
import { MapDrawing } from '../models/map/map-drawing';
import { SVGSelection } from '../models/types';
import { DrawingShapeWidget } from './drawings/drawing-shape-widget';
import { EllipseDrawingWidget } from './drawings/ellipse-drawing';
import { ImageDrawingWidget } from './drawings/image-drawing';
import { LineDrawingWidget } from './drawings/line-drawing';
import { RectDrawingWidget } from './drawings/rect-drawing';
import { TextDrawingWidget } from './drawings/text-drawing';
import { Widget } from './widget';

const LOCKED_ICON_PATH =
  'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z';
const UNLOCKED_OUTER_PATH =
  'M18 8h-8V6c0-1.1.9-2 2-2s2 .9 2 2h2c0-2.21-1.79-4-4-4S8 3.79 8 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z';
const LOCKED_ICON_COLOR = 'var(--gns3-lock-badge-locked-color)';
const UNLOCKED_ICON_COLOR = 'var(--gns3-lock-badge-unlocked-color)';
const BADGE_OUTLINE_COLOR = 'var(--gns3-lock-badge-outline-color)';

@Injectable()
export class DrawingWidget implements Widget {
  private drawingWidgets: DrawingShapeWidget[] = [];

  constructor(
    private textDrawingWidget: TextDrawingWidget,
    private imageDrawingWidget: ImageDrawingWidget,
    private rectDrawingWidget: RectDrawingWidget,
    private lineDrawingWidget: LineDrawingWidget,
    private ellipseDrawingWidget: EllipseDrawingWidget,
    private selectionManager: SelectionManager,
    private mapSettingsService: MapSettingsService
  ) {
    this.drawingWidgets = [
      this.textDrawingWidget,
      this.imageDrawingWidget,
      this.rectDrawingWidget,
      this.lineDrawingWidget,
      this.ellipseDrawingWidget,
    ];
  }

  public draw(view: SVGSelection) {
    const drawing_body = view.selectAll<SVGGElement, MapDrawing>('g.drawing_body').data((l: MapDrawing) => [l]);

    const drawing_body_enter = drawing_body.enter().append<SVGGElement>('g').attr('class', 'drawing_body');

    const drawing_body_merge = drawing_body.merge(drawing_body_enter).attr('transform', (d: MapDrawing) => {
      return `translate(${d.x},${d.y}) rotate(${d.rotation})`;
    });

    this.drawingWidgets.forEach((widget) => {
      widget.draw(drawing_body_merge);
    });

    drawing_body_merge.select('.layer_label_wrapper').remove();
    if (this.mapSettingsService.isLayerNumberVisible) {
      drawing_body_merge
        .filter((n) => n.element instanceof RectElement || n.element instanceof EllipseElement)
        .append<SVGRectElement>('rect')
        .attr('class', 'layer_label_wrapper')
        .attr('width', '26')
        .attr('height', '26')
        .attr('x', (n) => (n.element ? n.element.width / 2 - 13 : 0))
        .attr('y', (n) => (n.element ? n.element.height / 2 - 13 : 0))
        .attr('fill', 'red');
    }

    drawing_body_merge.select('.layer_label').remove();
    if (this.mapSettingsService.isLayerNumberVisible) {
      drawing_body_merge
        .filter((n) => n.element instanceof RectElement || n.element instanceof EllipseElement)
        .append<SVGTextElement>('text')
        .attr('class', 'layer_label')
        .text((elem) => elem.z)
        .attr('x', function (n) {
          if (n.z >= 100) return n.element ? n.element.width / 2 - 13 : 0;
          else if (n.z >= 10) return n.element ? n.element.width / 2 - 9 : 0;
          else return n.element.width / 2 - 5;
        })
        .attr('y', (n) => (n.element ? n.element.height / 2 + 5 : 0))
        .attr('style', () => {
          const styles: string[] = [];
          styles.push(`font-family: "Noto Sans"`);
          styles.push(`font-size: 11pt`);
          styles.push(`font-weight: bold`);
          return styles.join('; ');
        })
        .attr('fill', `#ffffff`);
    }

    drawing_body_merge.select('.drawing_lock_status_badge').remove();
    if (this.mapSettingsService.isItemLockStatusVisible) {
      const lockStatusBadge = drawing_body_merge
        .filter((d: MapDrawing) => d.element instanceof RectElement || d.element instanceof EllipseElement || d.element instanceof ImageElement)
        .append<SVGGElement>('g')
        .attr('class', 'drawing_lock_status_badge')
        .attr('pointer-events', 'none')
        .attr('transform', (d: MapDrawing) => {
          if (d.element instanceof EllipseElement) {
            // Fixed 12px inset from the 45° arc point — stays stable when ellipse is resized.
            const bx = d.element.cx + (d.element.rx - 12) / Math.SQRT2;
            const by = d.element.cy - (d.element.ry - 12) / Math.SQRT2;
            return `translate(${bx}, ${by})`;
          }
          const elemWidth = d.element.width > 0 ? d.element.width : 60;
          // Fixed 12px inset from the top-right corner — stays stable when drawing is resized.
          return `translate(${elemWidth - 12}, 12)`;
        });

      const lockedBadge = lockStatusBadge.filter((d: MapDrawing) => d.locked);
      lockedBadge
        .append<SVGPathElement>('path')
        .attr('d', LOCKED_ICON_PATH)
        .attr('transform', 'translate(-7.68, -7.68) scale(0.64)')
        .attr('fill', LOCKED_ICON_COLOR)
        .attr('stroke', BADGE_OUTLINE_COLOR)
        .attr('stroke-width', 1.2)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke fill');

      const unlockedBadge = lockStatusBadge.filter((d: MapDrawing) => !d.locked);
      const unlockedIconGroup = unlockedBadge
        .append<SVGGElement>('g')
        .attr('transform', 'translate(-7.68, -7.68) scale(0.64)');

      unlockedIconGroup
        .append<SVGPathElement>('path')
        .attr('d', UNLOCKED_OUTER_PATH)
        .attr('fill', UNLOCKED_ICON_COLOR)
        .attr('stroke', BADGE_OUTLINE_COLOR)
        .attr('stroke-width', 1.2)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke fill');

      unlockedIconGroup
        .append<SVGCircleElement>('circle')
        .attr('cx', 12)
        .attr('cy', 15)
        .attr('r', 2)
        .attr('fill', BADGE_OUTLINE_COLOR);
    }

    drawing_body_merge
      .select<SVGAElement>('line.top')
      .attr('stroke', 'transparent')
      .attr('stroke-width', '8px')
      .attr('x1', (drawing) =>
        drawing.element instanceof EllipseElement ? drawing.element.cx - drawing.element.width / 10 : '0'
      )
      .attr('x2', (drawing) =>
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
      .attr('x1', (drawing) =>
        drawing.element instanceof EllipseElement ? drawing.element.cx - drawing.element.width / 10 : '0'
      )
      .attr('x2', (drawing) =>
        drawing.element instanceof EllipseElement
          ? drawing.element.cx + drawing.element.width / 10
          : drawing.element.width
      )
      .attr('y1', (drawing) => drawing.element.height)
      .attr('y2', (drawing) => drawing.element.height)
      .attr('draggable', 'true')
      .attr('cursor', 'ns-resize');

    drawing_body_merge
      .select<SVGAElement>('line.right')
      .attr('stroke', 'transparent')
      .attr('stroke-width', '8px')
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', (drawing) =>
        drawing.element instanceof EllipseElement ? drawing.element.cy - drawing.element.height / 10 : '0'
      )
      .attr('y2', (drawing) =>
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
      .attr('x1', (drawing) => drawing.element.width)
      .attr('x2', (drawing) => drawing.element.width)
      .attr('y1', (drawing) =>
        drawing.element instanceof EllipseElement ? drawing.element.cy - drawing.element.height / 10 : '0'
      )
      .attr('y2', (drawing) =>
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
      .attr('cx', (drawing) => (drawing.element as LineElement).x1)
      .attr('cy', (drawing) => (drawing.element as LineElement).y1)
      .attr('r', 10)
      .attr('cursor', 'move');

    drawing_body_merge
      .select<SVGAElement>('circle.right')
      .attr('draggable', 'true')
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .attr('cx', (drawing) => (drawing.element as LineElement).x2)
      .attr('cy', (drawing) => (drawing.element as LineElement).y2)
      .attr('r', 10)
      .attr('cursor', 'move');

    drawing_body_merge.classed('drawing_selected', (n: MapDrawing) => this.selectionManager.isSelected(n));
  }
}
