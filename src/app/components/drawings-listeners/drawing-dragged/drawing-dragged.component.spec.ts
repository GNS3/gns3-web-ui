import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { DrawingElement } from '../../../cartography/models/drawings/drawing-element';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { DrawingService } from '../../../services/drawing.service';
import { MockedDrawingsDataSource, MockedDrawingService } from '../../project-map/project-map.component.spec';
import { DrawingDraggedComponent } from './drawing-dragged.component';

describe('DrawingDraggedComponent', () => {
  let component: DrawingDraggedComponent;
  let fixture: ComponentFixture<DrawingDraggedComponent>;
  const mockedDrawingService = new MockedDrawingService();
  const mockedDrawingsDataSource = new MockedDrawingsDataSource();
  const mockedDrawingsEventSource = new DrawingsEventSource();

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
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call drawing service when drawing is dragged', () => {
    const mapDrawingElement: DrawingElement = {
      width: 100,
      height: 100
    };
    const mapDrawing: MapDrawing = {
      id: 'sampleId',
      locked: false,
      projectId: 'sampleprojectId',
      rotation: 0,
      svg: 'sampleSvg',
      x: 0,
      y: 0,
      z: 0,
      element: mapDrawingElement
    };
    const drawingDraggedDataEvent = new DraggedDataEvent<MapDrawing>(mapDrawing, 0, 0);
    spyOn(mockedDrawingService, 'updatePosition').and.returnValue(Observable.of());

    mockedDrawingsEventSource.dragged.emit(drawingDraggedDataEvent);

    expect(mockedDrawingService.updatePosition).toHaveBeenCalled();
  });
});
