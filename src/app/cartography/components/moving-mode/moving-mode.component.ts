import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Context } from '../../models/context';
import { MovingEventSource } from '../../events/moving-event-source';
import { Subscription } from 'rxjs';
import { select } from 'd3-selection';

@Component({
    selector: 'app-moving-mode',
    templateUrl: './moving-mode.component.html',
    styleUrls: ['./moving-mode.component.scss']
})
export class MovingModeComponent implements OnInit, OnDestroy {
    @Input('svg') svg: SVGSVGElement;

    private scrollListener: Function;
    private mouseupListener: Function;
    private mousedownListener: Function;
    private mousemoveListener: Function;
    private movingModeState: Subscription;

    constructor(
        private context: Context,
        private movingEventSource: MovingEventSource
    ) {}

    ngOnInit() {
        this.movingModeState = this.movingEventSource.movingModeState.subscribe((event: boolean) => {
            event ? this.activate() : this.deactivate();
        });
    }

    activate() {
        this.addMoveListener();
        this.addZoomListener();
    }

    addMoveListener() {
        this.mousemoveListener = (event: MouseEvent) => {
            const view = select(this.svg);
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
        this.mousedownListener = (event: MouseEvent) => {
            this.mouseupListener = (event: MouseEvent) => {
                this.removelisteners();
            };

            this.svg.addEventListener('mouseup', this.mouseupListener as EventListenerOrEventListenerObject);
            this.svg.addEventListener('mousemove', this.mousemoveListener as EventListenerOrEventListenerObject);
        };
        this.svg.addEventListener('mousedown', this.mousedownListener as EventListenerOrEventListenerObject);
    }

    addZoomListener() { 
        this.scrollListener = (event: WheelEvent) => {
            event.stopPropagation();
            event.preventDefault();

            let zoom = event.deltaY;
            zoom = event.deltaMode === 0 ? zoom/100 : zoom/3;

            const view = select(this.svg);
            const canvas = view.selectAll<SVGGElement, Context>('g.canvas').data([this.context]);
            
            canvas.attr('transform', () => {
                this.context.transformation.k = this.context.transformation.k - zoom/10;

                const xTrans = this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
                const yTrans = this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
                const kTrans = this.context.transformation.k;

                return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
            });
        };
        document.addEventListener('wheel', this.scrollListener as EventListenerOrEventListenerObject);
    }

    removelisteners() {
        this.svg.removeEventListener('mouseup', this.mouseupListener as EventListenerOrEventListenerObject);
        this.svg.removeEventListener('mousemove', this.mousemoveListener as EventListenerOrEventListenerObject);
    }

    deactivate() {
        this.svg.removeEventListener('mouseup', this.mouseupListener as EventListenerOrEventListenerObject);
        this.svg.removeEventListener('mousedown', this.mousedownListener as EventListenerOrEventListenerObject);
        this.svg.removeEventListener('mousemove', this.mousemoveListener as EventListenerOrEventListenerObject);
        document.removeEventListener('wheel', this.scrollListener as EventListenerOrEventListenerObject);
    }

    ngOnDestroy() {
        this.movingModeState.unsubscribe();
    }
}
