import { HostListener, ElementRef, Renderer, Directive, Input, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';
import { select } from 'd3-selection';
import { MapScaleService } from '../../services/mapScale.service';

@Directive({
    selector: '[zoomingCanvas]',
})
export class ZoomingCanvasDirective implements OnInit, OnDestroy {
    private movingModeState: Subscription;
    private activated: boolean = false;
    
    constructor(
        private element: ElementRef,
        private movingEventSource: MovingEventSource,
        private context: Context,
        private mapsScaleService: MapScaleService
    ) {}

    ngOnInit() {
        this.movingModeState = this.movingEventSource.movingModeState.subscribe((event: boolean) => {
            this.activated = event;
        });
    }

    ngOnDestroy() {
        this.movingModeState.unsubscribe();
    }

    @HostListener('window:wheel', ['$event'])
    onWheel(event: WheelEvent) {
        if (this.activated) {
            event.stopPropagation();
            event.preventDefault();

            let zoom = event.deltaY;
            zoom = event.deltaMode === 0 ? zoom/100 : zoom/3;

            const view = select(this.element.nativeElement);
            const canvas = view.selectAll<SVGGElement, Context>('g.canvas').data([this.context]);
            
            canvas.attr('transform', () => {
                this.context.transformation.k = this.context.transformation.k - zoom/10;

                const xTrans = this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
                const yTrans = this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
                const kTrans = this.context.transformation.k;
                this.mapsScaleService.setScale(kTrans);

                return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
            });
        }
    }
}
