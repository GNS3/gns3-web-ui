import {ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawingsEventSource } from 'app/cartography/events/drawings-event-source';
import { SvgToDrawingConverter } from 'app/cartography/helpers/svg-to-drawing-converter';
import { DrawingComponent } from './drawing.component';
import { DraggableComponent } from '../draggable/draggable.component';
import { EllipseComponent } from './drawings/ellipse/ellipse.component';
import { ImageComponent } from './drawings/image/image.component';
import { LineComponent } from './drawings/line/line.component';
import { RectComponent } from './drawings/rect/rect.component';
import { TextComponent } from './drawings/text/text.component';
import { CommonModule } from '@angular/common';

describe('DrawingComponent', () => {
  let component: DrawingComponent;
  let fixture: ComponentFixture<DrawingComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [
        DrawingComponent,
        DraggableComponent,
        EllipseComponent,
        ImageComponent,
        LineComponent,
        RectComponent,
        TextComponent
      ],
      imports: [CommonModule],
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
