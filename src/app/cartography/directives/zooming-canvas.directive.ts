import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { MapScaleService } from '../../services/mapScale.service';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';

@Directive({
  selector: '[zoomingCanvas]',
})
export class ZoomingCanvasDirective implements OnInit, OnDestroy {
  private wheelListener: Function;
  private movingModeState: Subscription;

  constructor(
    private element: ElementRef,
    private movingEventSource: MovingEventSource,
    private context: Context,
    private mapsScaleService: MapScaleService
  ) {}

  ngOnInit() {
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
      event.preventDefault();

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

    this.element.nativeElement.addEventListener('wheel', this.wheelListener as EventListenerOrEventListenerObject, {
      passive: false,
    });
  }

  removeListener() {
    this.element.nativeElement.removeEventListener('wheel', this.wheelListener as EventListenerOrEventListenerObject);
  }
}
