import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { select, Selection } from 'd3-selection';
import { line, curveCatmullRom } from 'd3-shape';
import { Subscription } from 'rxjs';
import { DrawingsDataSource } from '../../datasources/drawings-datasource';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { Context } from '../../models/context';
import { CurveElement } from '../../models/drawings/curve-element';
import { Drawing } from '../../models/drawing';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '../../../services/drawing.service';
import { ToolsService } from '../../../services/tools.service';

@Component({
  selector: 'app-curve-drawing',
  standalone: true,
  template: '',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurveDrawingComponent implements OnInit, OnDestroy {
  readonly svg = input<SVGSVGElement>(undefined);
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);

  private isDrawing = false;
  private points: { x: number; y: number }[] = [];
  private drawingSelected: Subscription;
  private svgSelection: Selection<SVGSVGElement, unknown, null, undefined>;
  private canvasGroup: Selection<SVGGElement, unknown, null, undefined>;
  private previewPath: Selection<SVGPathElement, unknown, null, undefined>;

  private drawingsEventSource = inject(DrawingsEventSource);
  private context = inject(Context);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingService = inject(DrawingService);
  private toolsService = inject(ToolsService);

  ngOnInit() {
    this.svgSelection = select(this.svg());
    this.canvasGroup = this.svgSelection.select<SVGGElement>('g.canvas');

    this.drawingSelected = this.drawingsEventSource.selected.subscribe((evt) => {
      evt === 'curve' ? this.activate() : this.deactivate();
    });
  }

  private activate() {
    const self = this;

    // Disable selection tool to prevent conflict during curve drawing
    this.toolsService.selectionToolActivation(false);

    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const coordinates = self.getCanvasCoordinates(event);
      self.isDrawing = true;
      self.points = [{ x: coordinates[0], y: coordinates[1] }];

      // Create preview path
      self.createPreviewPath();

      // Add global mousemove and mouseup listeners
      document.addEventListener('mousemove', onMouseMove, { passive: false });
      document.addEventListener('mouseup', onMouseUp, { passive: false });
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!self.isDrawing) return;

      event.preventDefault();
      const coordinates = self.getCanvasCoordinates(event);
      self.points.push({ x: coordinates[0], y: coordinates[1] });
      self.updatePreviewPath();
    };

    const onMouseUp = (event: MouseEvent) => {
      if (!self.isDrawing) return;

      event.preventDefault();
      self.isDrawing = false;

      // Remove global listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Create the curve drawing if we have enough points
      if (self.points.length > 1) {
        self.createCurveDrawing();
      }

      // Remove preview
      self.removePreviewPath();

      // Auto-exit curve tool after drawing completes
      self.drawingsEventSource.drawingCompleted.emit('curve');
    };

    // Store listener reference for removal
    (this.svg() as any)._curveDrawingListener = onMouseDown;
    this.svg().addEventListener('mousedown', onMouseDown);
  }

  private deactivate() {
    // Re-enable selection tool when curve drawing is deactivated
    this.toolsService.selectionToolActivation(true);

    // Remove event listener
    const oldListener = (this.svg() as any)._curveDrawingListener;
    if (oldListener) {
      this.svg().removeEventListener('mousedown', oldListener);
      delete (this.svg() as any)._curveDrawingListener;
    }
    this.removePreviewPath();
    this.isDrawing = false;
    this.points = [];
  }

  private getCanvasCoordinates(event: MouseEvent): [number, number] {
    const node = this.canvasGroup.node();
    const transform = this.context.transformation;
    const zeroZero = this.context.getZeroZeroTransformationPoint();

    const x = (event.pageX - (zeroZero.x + transform.x)) / transform.k;
    const y = (event.pageY - (zeroZero.y + transform.y)) / transform.k;

    return [x, y];
  }

  private createPreviewPath() {
    if (!this.canvasGroup.select<SVGGElement>('g.curve-preview').node()) {
      this.canvasGroup.append<SVGGElement>('g').attr('class', 'curve-preview');
    }

    const previewGroup = this.canvasGroup.select<SVGGElement>('g.curve-preview');
    this.previewPath = previewGroup.append<SVGPathElement>('path')
      .attr('stroke', 'var(--gns3-canvas-link-color)')
      .attr('stroke-width', '2')
      .attr('fill', 'none')
      .attr('stroke-dasharray', '5,5');
  }

  private updatePreviewPath() {
    if (!this.previewPath || this.points.length < 2) return;

    // Generate path data by directly connecting points (no curve smoothing)
    let pathData = `M ${this.points[0].x} ${this.points[0].y}`;
    for (let i = 1; i < this.points.length; i++) {
      pathData += ` L ${this.points[i].x} ${this.points[i].y}`;
    }

    this.previewPath.attr('d', pathData);
  }

  private removePreviewPath() {
    if (this.previewPath) {
      this.previewPath.remove();
      this.previewPath = null;
    }
    this.canvasGroup.select<SVGGElement>('g.curve-preview').remove();
  }

  private createCurveDrawing() {
    // Calculate bounding box
    const xs = this.points.map(p => p.x);
    const ys = this.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    // Create CurveElement
    const curveElement = new CurveElement();
    curveElement.points = this.points.map(p => ({ x: p.x - minX, y: p.y - minY }));

    // Get default stroke color from CSS variable
    const defaultStrokeColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--gns3-canvas-link-color')
      .trim() || 'var(--gns3-canvas-link-color)';
    curveElement.stroke = defaultStrokeColor;

    curveElement.stroke_width = 3;
    curveElement.stroke_dasharray = 'none';
    curveElement.curve_type = 'none';
    curveElement.arrow_start = false;
    curveElement.arrow_end = false;
    curveElement.width = width;
    curveElement.height = height;

    // Convert to SVG
    const svgContent = this.convertCurveToSvg(curveElement);

    // Save to backend
    this.drawingService.add(
      this.controller(),
      this.project().project_id,
      minX,
      minY,
      svgContent
    ).subscribe((drawing: Drawing) => {
      this.drawingsDataSource.add(drawing);
    });
  }

  private convertCurveToSvg(curve: CurveElement): string {
    // Generate path data by directly connecting points (no curve smoothing)
    let pathData = '';
    if (curve.points.length > 0) {
      pathData = `M ${curve.points[0].x} ${curve.points[0].y}`;
      for (let i = 1; i < curve.points.length; i++) {
        pathData += ` L ${curve.points[i].x} ${curve.points[i].y}`;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${curve.width}" height="${curve.height}">
      <path d="${pathData}" stroke="${curve.stroke}" stroke-width="${curve.stroke_width}"
        fill="none" stroke-dasharray="${curve.stroke_dasharray}"
        data-curve-type="none"
        data-arrow-start="${curve.arrow_start}"
        data-arrow-end="${curve.arrow_end}" />
    </svg>`;
  }

  ngOnDestroy() {
    this.deactivate();
    this.drawingSelected.unsubscribe();
  }
}
