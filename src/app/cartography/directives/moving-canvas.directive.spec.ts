import { ComponentFixture, TestBed, async, tick, fakeAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Context } from '../models/context';
import { MovingEventSource } from '../events/moving-event-source';
import { MovingCanvasDirective } from './moving-canvas.directive';
import { Component } from '@angular/core';

@Component({
  template: `<svg #svg class="map" preserveAspectRatio="none" movingCanvas>
    <g class="canvas" transform="translate(0, 0) scale(1)"></g>
  </svg>`,
})
class DummyComponent {
  constructor() {}
}

describe('MovingCanvasDirective', () => {
  let component: DummyComponent;
  let fixture: ComponentFixture<DummyComponent>;
  let movingEventSource = new MovingEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: MovingEventSource, useValue: movingEventSource },
        { provide: Context, useClass: Context },
      ],
      declarations: [DummyComponent, MovingCanvasDirective],
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

  it('should move canvas if moving mode is activated', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let xMovement: number = 200;
    let yMovement: number = 200;

    canvas.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 0,
        clientY: 0,
        screenY: 0,
        screenX: 0,
        view: window,
      })
    );
    tick();
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);
  }));

  it('should not move canvas if moving mode is not activated', fakeAsync(() => {
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');

    canvas.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 0,
        clientY: 0,
        screenY: 0,
        screenX: 0,
        view: window,
      })
    );
    tick();
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: 1000,
        movementY: 1000,
      } as MouseEventInit)
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual('translate(0, 0) scale(1)');
  }));

  it('should not move canvas after mouseup event', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let xMovement: number = 200;
    let yMovement: number = 200;

    canvas.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 0,
        clientY: 0,
        screenY: 0,
        screenX: 0,
        view: window,
      })
    );
    tick();
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);

    canvas.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: 1000,
        movementY: 1000,
      } as MouseEventInit)
    );
    tick();
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);
  }));

  it('should not move canvas after deactivation of moving mode', fakeAsync(() => {
    movingEventSource.movingModeState.emit(true);
    const canvas: HTMLElement = fixture.debugElement.nativeElement.querySelector('.canvas');
    let xMovement: number = 200;
    let yMovement: number = 200;

    canvas.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 0,
        clientY: 0,
        screenY: 0,
        screenX: 0,
        view: window,
      })
    );
    tick();
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);

    movingEventSource.movingModeState.emit(false);
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: 1000,
        movementY: 1000,
      } as MouseEventInit)
    );
    tick();

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);
  }));
});
