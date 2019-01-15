import { DrawingDraggedComponent } from './drawing-dragged.component';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { DrawingService } from '../../../services/drawing.service';
import { MockedDrawingService, MockedDrawingsDataSource } from '../../project-map/project-map.component.spec';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { DrawingElement } from '../../../cartography/models/drawings/drawing-element';
import { Observable } from 'rxjs';

describe('DrawingDraggedComponent', () => {
  let component: DrawingDraggedComponent;
  let fixture: ComponentFixture<DrawingDraggedComponent>;
  let mockedDrawingService = new MockedDrawingService();
  let mockedDrawingsDataSource = new MockedDrawingsDataSource();
  let mockedDrawingsEventSource = new DrawingsEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DrawingService, useValue: mockedDrawingService },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockedDrawingsEventSource }
      ],
      declarations: [DrawingDraggedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingDraggedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call drawing service when drawing is dragged', () => {
    fixture.detectChanges();
    const mapDrawingElement: DrawingElement = {
      width: 100,
      height: 100
    };
    const mapDrawing: MapDrawing = {
      id: 'sampleId',
      projectId: 'sampleprojectId',
      rotation: 0,
      svg: 'sampleSvg',
      x: 0,
      y: 0,
      z: 0,
      element: mapDrawingElement
    };
    const drawingDraggedDataEvent = new DraggedDataEvent<MapDrawing>(mapDrawing, 0, 0);
    spyOn(mockedDrawingService, 'updatePosition').and.returnValue(Observable.of({}));

    mockedDrawingsEventSource.dragged.emit(drawingDraggedDataEvent);

    expect(mockedDrawingService.updatePosition).toHaveBeenCalled();
  });
});
