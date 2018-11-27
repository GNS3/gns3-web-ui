import { ComponentFixture, TestBed, async } from '@angular/core/testing';

import { DrawingResizingComponent } from './drawing-resizing.component'
import { DrawingsWidget } from '../../widgets/drawings';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subscription } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { ResizingEnd } from '../../events/resizing';
import { MapDrawing } from '../../models/map/map-drawing';

export class DrawingWidgetMock {
    resizingFinished = new EventEmitter<ResizingEnd<MapDrawing>>();
    constructor(){}

    public emitEvent(){
        const evt = new ResizingEnd<MapDrawing>();
        evt.x = 0;
        evt.y = 0;
        evt.width = 10;
        evt.height = 10;
        evt.datum = {} as MapDrawing;

        this.resizingFinished.emit(evt);
    }    
}

describe('DrawizngResizingComponent', () => {
    let component: DrawingResizingComponent;
    let fixture: ComponentFixture<DrawingResizingComponent>;
    let drawingWidgetMock = new DrawingWidgetMock;
    let drawingEventSource = new DrawingsEventSource

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule
            ],
            providers: [
                { provide: DrawingsWidget, useValue: drawingWidgetMock },
                { provide: DrawingsEventSource, useValue: drawingEventSource}
            ],
            declarations: [
                DrawingResizingComponent
            ]
        })
        .compileComponents();
    }));

     beforeEach(() => {
        fixture = TestBed.createComponent(DrawingResizingComponent);
        component = fixture.componentInstance;
     });

     it('should create', () => {
        expect(component).toBeTruthy();
     });

     it('should emit event after size changes', () => {
        spyOn(drawingEventSource.resized, 'emit');

        drawingWidgetMock.emitEvent();
        fixture.detectChanges();

        expect(drawingEventSource.resized.emit).toHaveBeenCalled();        
     });
});
