import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { pointer, select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { MapScaleService } from '@services/mapScale.service';
import { Project } from '@models/project';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';
import { GridAnchorService } from '../services/grid-anchor.service';

@Directive({
  standalone: true,
  selector: '[appZoomingCanvas]',
})
export class ZoomingCanvasDirective implements OnInit, OnDestroy {
  private wheelListener: Function;
  private movingModeState: Subscription;

  constructor(
    private element: ElementRef,
    private renderer: Renderer2,
    private movingEventSource: MovingEventSource,
    private context: Context,
    private mapsScaleService: MapScaleService,
    private gridAnchor: GridAnchorService
  ) {}

  /** Grid sizes — needed to keep the background grid anchored while zooming. */
  @Input('project') project: Project;

  ngOnInit() {
    // Disable default browser zoom via CSS for passive event listener support
    this.renderer.setStyle(this.element.nativeElement, 'touch-action', 'none');
    this.renderer.setStyle(this.element.nativeElement, '-ms-touch-action', 'none');

    this.movingModeState = this.movingEventSource.movingModeState.subscribe((event: boolean) => {
      event ? this.addListener() : this.removeListener();
    });
  }

  ngOnDestroy() {
    this.movingModeState.unsubscribe();
  }

  addListener() {
    this.wheelListener = (event: WheelEvent) => {
      event.stopPropagation();
      // In pan mode the wheel means zoom — stop the browser from ALSO scrolling
      // the page (which requires a non-passive listener; passive:true can't
      // preventDefault).
      event.preventDefault();

      let zoom = event.deltaY;
      zoom = event.deltaMode === 0 ? zoom / 100 : zoom / 3;

      const view = select(this.element.nativeElement);
      const canvas = view.selectAll<SVGGElement, Context>('g.canvas').data([this.context]);

      canvas.attr('transform', () => {
        const oldK = this.context.transformation.k;
        if (!oldK || isNaN(oldK)) return;
        // Proportional zoom: each wheel notch multiplies k by ~exp(∓0.1), so the
        // step feels uniform at every zoom level. (The old absolute −zoom/10
        // step made one notch a 50%+ jump when zoomed far out.)
        const newK = Math.min(
          MapScaleService.MAX_SCALE,
          Math.max(MapScaleService.MIN_SCALE, oldK * Math.exp(-zoom / 10))
        );

        // Cursor-centered zoom: keep the canvas point under the cursor fixed.
        // That canvas point is (svg cursor - origin - pan) / k.
        const cursor = pointer(event, this.element.nativeElement);
        const origin = this.context.getZeroZeroTransformationPoint();
        const tx = origin.x + this.context.transformation.x;
        const ty = origin.y + this.context.transformation.y;
        const canvasX = (cursor[0] - tx) / oldK;
        const canvasY = (cursor[1] - ty) / oldK;

        // Bake the offset into the pan (transformation.x/y) so the transform
        // that graphLayout.draw() rebuilds after the scale change stays centered
        // on the cursor instead of snapping back to the canvas origin.
        this.context.transformation.k = newK;
        this.context.transformation.x += canvasX * (oldK - newK);
        this.context.transformation.y += canvasY * (oldK - newK);

        const xTrans = origin.x + this.context.transformation.x;
        const yTrans = origin.y + this.context.transformation.y;
        this.mapsScaleService.setScale(newK);

        return `translate(${xTrans}, ${yTrans}) scale(${newK})`;
      });

      // The grid tile scales with k — re-anchor the background grid in the
      // same event so it doesn't lag a frame behind the zoom.
      this.gridAnchor.apply(this.element.nativeElement, this.context, this.project);
    };

    // Non-passive so preventDefault() can stop the page from scrolling while
    // zooming. touch-action: none in ngOnInit handles touch pinch-zoom.
    this.element.nativeElement.addEventListener('wheel', this.wheelListener as EventListenerOrEventListenerObject, {
      passive: false,
    });
  }

  removeListener() {
    this.element.nativeElement.removeEventListener('wheel', this.wheelListener as EventListenerOrEventListenerObject);
  }
}
