import { ComponentFixture, TestBed, async } from '@angular/core/testing';

import { DrawingResizingComponent } from './drawing-resizing.component';
import { DrawingsWidget } from '../../widgets/drawings';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EventEmitter } from '@angular/core';
import { ResizingEnd } from '../../events/resizing';
import { MapDrawing } from '../../models/map/map-drawing';

export class DrawingWidgetMock {
  resizingFinished = new EventEmitter<ResizingEnd<MapDrawing>>();
  evt: any;
  constructor() {}

  emitEvent() {
    const evt = new ResizingEnd<MapDrawing>();
    evt.x = 0;
    evt.y = 0;
    evt.width = 10;
    evt.height = 10;
    evt.datum = {} as MapDrawing;

    this.resizingFinished.emit(evt);
  }
}

describe('DrawingResizingComponent', () => {
  let component: DrawingResizingComponent;
  let fixture: ComponentFixture<DrawingResizingComponent>;
  let drawingsWidgetMock = new DrawingWidgetMock();
  let drawingsEventSource = new DrawingsEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: DrawingsWidget, useValue: drawingsWidgetMock },
        { provide: DrawingsEventSource, useValue: drawingsEventSource }
      ],
      declarations: [DrawingResizingComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingResizingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit event after size changes', () => {
    spyOn(drawingsEventSource.resized, 'emit');
    const evt = new ResizingEnd<MapDrawing>();
    evt.x = 0;
    evt.y = 0;
    evt.width = 10;
    evt.height = 10;
    evt.datum = {} as MapDrawing;

    drawingsWidgetMock.emitEvent();

    expect(drawingsEventSource.resized.emit).toHaveBeenCalled();
  });
});
