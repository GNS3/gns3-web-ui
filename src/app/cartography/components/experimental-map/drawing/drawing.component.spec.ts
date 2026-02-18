import {ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawingsEventSource } from 'app/cartography/events/drawings-event-source';
import { SvgToDrawingConverter } from 'app/cartography/helpers/svg-to-drawing-converter';
import { DrawingComponent } from './drawing.component';

describe('DrawingComponent', () => {
  let component: DrawingComponent;
  let fixture: ComponentFixture<DrawingComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [DrawingComponent],
      providers:[SvgToDrawingConverter,DrawingsEventSource]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
