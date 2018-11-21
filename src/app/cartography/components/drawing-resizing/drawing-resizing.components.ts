import { Component, OnInit, ElementRef, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { select } from 'd3-selection';
import { DrawingsWidget } from '../../widgets/drawings';
import { MapDrawing } from '../../models/map/map-drawing';
import { DraggedDataEvent } from '../../events/event-source';
import { ResizingEnd } from '../../events/resizing';

export class DrawingResizedEvent{
    constructor() {};
}


@Component({
    selector: 'app-drawing-resizing',
    template: `<ng-content></ng-content>`,
    styleUrls: ['./drawing-resizing.component.scss']
})
export class DrawingResizingComponent implements OnInit, OnDestroy{
    private resizingFinished: Subscription;

    @Input('svg') svg: SVGSVGElement;

    constructor(
        private drawingsWidget: DrawingsWidget,
        private drawingsEventSource: DrawingsEventSource
    ) {}

    ngOnInit() {
        const svg = select(this.svg);

        this.resizingFinished = this.drawingsWidget.resizingFinished.subscribe((evt: ResizingEnd<MapDrawing>) => {
            console.log("inside component");
            this.drawingsEventSource.resized.emit(new DraggedDataEvent<MapDrawing>(evt.datum, evt.x, evt.y));
        });
    }

    ngOnDestroy() {
        this.resizingFinished.unsubscribe();
    }
}