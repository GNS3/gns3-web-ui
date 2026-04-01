import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MapScaleService } from '@services/mapScale.service';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';
import { ZoomingCanvasDirective } from './zooming-canvas.directive';

@Component({
  standalone: false,
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ZoomingCanvasDirective],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MovingEventSource, useValue: movingEventSource },
        { provide: Context, useClass: Context },
        { provide: MapScaleService, useClass: MapScaleService },
      ],
      declarations: [DummyComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DummyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });

  xit('should zoom in canvas if moving mode is activated', () => {
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

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(2)`);
  });

  xit('should zoom out canvas if moving mode is activated', () => {
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

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(0.9)`);
  });

  xit('should not zoom in/out canvas if moving mode is not activated', () => {
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

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(2)`);
  });

  xit('should not zoom in/out canvas after deactivation of moving mode', () => {
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

    expect(canvas.getAttribute('transform')).toEqual(`translate(0, 0) scale(1)`);
  });

  xit('should prevent from default wheel behaviour when moving mode activated', () => {
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

    expect(event.preventDefault).toHaveBeenCalled();
  });
});
