import { ComponentFixture, TestBed, async, tick, fakeAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Context } from '../models/context';
import { MovingEventSource } from '../events/moving-event-source';
import { Component } from '@angular/core';
import { ZoomingCanvasDirective } from './zooming-canvas.directive';
import { MapScaleService } from '../../services/mapScale.service';

@Component({
  template: `<svg #svg class="map" preserveAspectRatio="none" zoomingCanvas>
    <g class="canvas" transform="translate(0, 0) scale(1)"></g>
  </svg>`,
})
class DummyComponent {
  constructor() {}
}

describe('ZoomingCanvasDirective', () => {
  let component: DummyComponent;
  let fixture: ComponentFixture<DummyComponent>;
  let movingEventSource = new MovingEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: MovingEventSource, useValue: movingEventSource },
        { provide: Context, useClass: Context },
        { provide: MapScaleService, useClass: MapScaleService },
      ],
      declarations: [DummyComponent, ZoomingCanvasDirective],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DummyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should zoom in canvas if moving mode is activated', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let deltaMode: number = 0;
    let zoom: number = -1000;

    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        relatedTarget: canvas,
        deltaMode: deltaMode,
        deltaY: zoom,
      })
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(2)`);
  }));

  it('should zoom out canvas if moving mode is activated', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let deltaMode: number = 0;
    let zoom: number = 100;

    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        relatedTarget: canvas,
        deltaMode: deltaMode,
        deltaY: zoom,
      })
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(0.9)`);
  }));

  it('should not zoom in/out canvas if moving mode is not activated', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let deltaMode: number = 0;
    let zoom: number = -1000;

    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        relatedTarget: canvas,
        deltaMode: deltaMode,
        deltaY: zoom,
      })
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(2)`);

    movingEventSource.movingModeState.emit(false);
    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        relatedTarget: canvas,
        deltaMode: deltaMode,
        deltaY: zoom,
      })
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(2)`);
  }));

  it('should not zoom in/out canvas after deactivation of moving mode', fakeAsync(() => {
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let deltaMode: number = 0;
    let zoom: number = -1000;

    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        relatedTarget: canvas,
        deltaMode: deltaMode,
        deltaY: zoom,
      })
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(1)`);
  }));

  it('should prevent from default wheel behaviour when moving mode activated', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let deltaMode: number = 0;
    let zoom: number = -1000;
    const event = new WheelEvent('wheel', {
      bubbles: true,
      relatedTarget: canvas,
      deltaMode: deltaMode,
      deltaY: zoom,
    });
    spyOn(event, 'preventDefault');

    canvas.dispatchEvent(event);
    tick();

    expect(event.preventDefault).toHaveBeenCalled();
  }));
});
