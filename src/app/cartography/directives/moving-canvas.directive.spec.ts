import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MovingEventSource } from '../events/moving-event-source';
import { Context } from '../models/context';
import { MovingCanvasDirective } from './moving-canvas.directive';

@Component({
  standalone: false,
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MovingCanvasDirective, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MovingEventSource, useValue: movingEventSource },
        { provide: Context, useClass: Context },
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

  xit('should move canvas if moving mode is activated', () => {
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
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);
  });

  xit('should not move canvas if moving mode is not activated', () => {
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
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: 1000,
        movementY: 1000,
      } as MouseEventInit)
    );

    expect(canvas.getAttribute('transform')).toEqual('translate(0, 0) scale(1)');
  });

  xit('should not move canvas after mouseup event', () => {
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
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);

    canvas.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: 1000,
        movementY: 1000,
      } as MouseEventInit)
    );
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);
  });

  xit('should not move canvas after deactivation of moving mode', () => {
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
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        relatedTarget: canvas,
        movementX: xMovement,
        movementY: yMovement,
      } as MouseEventInit)
    );

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

    expect(canvas.getAttribute('transform')).toEqual(`translate(${xMovement}, ${yMovement}) scale(1)`);
  });
});
