import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { Project } from '@models/project';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';
import { GridAnchorService } from '../services/grid-anchor.service';

@Directive({
  standalone: true,
  selector: '[appMovingCanvas]',
})
export class MovingCanvasDirective implements OnInit, OnDestroy {
  private mouseupListener: Function | null = null;
  private mousemoveListener: Function | null = null;
  private movingModeState: Subscription;
  private activated: boolean = false;
  private isDragging: boolean = false;

  constructor(
    private element: ElementRef,
    private movingEventSource: MovingEventSource,
    private context: Context,
    private gridAnchor: GridAnchorService
  ) {}

  /** Grid sizes — needed to keep the background grid anchored while panning. */
  @Input('project') project: Project;

  ngOnInit() {
    this.movingModeState = this.movingEventSource.movingModeState.subscribe((event: boolean) => {
      this.activated = event;
      if (!event) {
        this.removelisteners();
      }
    });
  }

  ngOnDestroy() {
    this.movingModeState.unsubscribe();
    this.removelisteners();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (this.activated && !this.isDragging) {
      this.isDragging = true;

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

        // The grid patterns sit outside g.canvas — move their anchor with the
        // pan so the background grid stays glued to the scene grid.
        this.gridAnchor.apply(this.element.nativeElement, this.context, this.project);
      };

      this.mouseupListener = (event: MouseEvent) => {
        this.isDragging = false;
        this.removelisteners();
      };

      // Add mousemove to element for performance
      this.element.nativeElement.addEventListener(
        'mousemove',
        this.mousemoveListener as EventListenerOrEventListenerObject
      );

      // Add mouseup to document to catch mouse release anywhere on page
      document.addEventListener(
        'mouseup',
        this.mouseupListener as EventListenerOrEventListenerObject
      );
    }
  }

  removelisteners() {
    if (this.mousemoveListener) {
      this.element.nativeElement.removeEventListener(
        'mousemove',
        this.mousemoveListener as EventListenerOrEventListenerObject
      );
      this.mousemoveListener = null;
    }

    if (this.mouseupListener) {
      document.removeEventListener(
        'mouseup',
        this.mouseupListener as EventListenerOrEventListenerObject
      );
      this.mouseupListener = null;
    }

    this.isDragging = false;
  }
}
