import { HostListener, ElementRef, Directive, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';
import { select } from 'd3-selection';

@Directive({
  selector: '[movingCanvas]',
})
export class MovingCanvasDirective implements OnInit, OnDestroy {
  private mouseupListener: Function;
  private mousemoveListener: Function;
  private movingModeState: Subscription;
  private activated: boolean = false;

  constructor(private element: ElementRef, private movingEventSource: MovingEventSource, private context: Context) {}

  ngOnInit() {
    this.movingModeState = this.movingEventSource.movingModeState.subscribe((event: boolean) => {
      this.activated = event;
      if (!event) this.removelisteners();
    });
  }

  ngOnDestroy() {
    this.movingModeState.unsubscribe();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (this.activated) {
      this.mousemoveListener = (event: MouseEvent) => {
        const view = select(this.element.nativeElement);
        const canvas = view.selectAll<SVGGElement, Context>('g.canvas').data([this.context]);

        canvas.attr('transform', () => {
          this.context.transformation.x = this.context.transformation.x + event.movementX;
          this.context.transformation.y = this.context.transformation.y + event.movementY;

          const xTrans = this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
          const yTrans = this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
          const kTrans = this.context.transformation.k;

          return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
        });
      };

      this.mouseupListener = (event: MouseEvent) => {
        this.removelisteners();
      };

      this.element.nativeElement.addEventListener(
        'mouseup',
        this.mouseupListener as EventListenerOrEventListenerObject
      );
      this.element.nativeElement.addEventListener(
        'mousemove',
        this.mousemoveListener as EventListenerOrEventListenerObject
      );
    }
  }

  removelisteners() {
    this.element.nativeElement.removeEventListener(
      'mouseup',
      this.mouseupListener as EventListenerOrEventListenerObject
    );
    this.element.nativeElement.removeEventListener(
      'mousemove',
      this.mousemoveListener as EventListenerOrEventListenerObject
    );
  }
}
