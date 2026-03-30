import { Directive, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { MapScaleService } from '@services/mapScale.service';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';

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
    private mapsScaleService: MapScaleService
  ) {}

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

      let zoom = event.deltaY;
      zoom = event.deltaMode === 0 ? zoom / 100 : zoom / 3;

      const view = select(this.element.nativeElement);
      const canvas = view.selectAll<SVGGElement, Context>('g.canvas').data([this.context]);

      canvas.attr('transform', () => {
        this.context.transformation.k = this.context.transformation.k - zoom / 10;

        const xTrans = this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
        const yTrans = this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
        const kTrans = this.context.transformation.k;
        this.mapsScaleService.setScale(kTrans);

        return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
      });
    };

    // Use passive: true since we're using CSS to prevent default zoom
    this.element.nativeElement.addEventListener('wheel', this.wheelListener as EventListenerOrEventListenerObject, {
      passive: true,
    });
  }

  removeListener() {
    this.element.nativeElement.removeEventListener('wheel', this.wheelListener as EventListenerOrEventListenerObject);
  }
}
