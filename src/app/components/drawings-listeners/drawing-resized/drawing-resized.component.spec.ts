import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { ResizedDataEvent } from '../../../cartography/events/event-source';
import { DrawingElement } from '../../../cartography/models/drawings/drawing-element';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { DrawingService } from '../../../services/drawing.service';
import { MockedDrawingsDataSource, MockedDrawingService } from '../../project-map/project-map.component.spec';
import { DrawingResizedComponent } from './drawing-resized.component';

describe('DrawingResizedComponent', () => {
  let component: DrawingResizedComponent;
  let fixture: ComponentFixture<DrawingResizedComponent>;
  const mockedDrawingService = new MockedDrawingService();
  const mockedDrawingsDataSource = new MockedDrawingsDataSource();
  const mockedDrawingsEventSource = new DrawingsEventSource();
  const mockedMapDrawingToSvgConverter = new MapDrawingToSvgConverter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DrawingService, useValue: mockedDrawingService },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockedDrawingsEventSource },
        { provide: MapDrawingToSvgConverter, useValue: mockedMapDrawingToSvgConverter }
      ],
      declarations: [DrawingResizedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingResizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call drawing service when drawing is resized', () => {
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
    const drawingResizedDataEvent = new ResizedDataEvent<MapDrawing>(mapDrawing, 0, 0, 100, 100);
    spyOn(mockedDrawingService, 'updateSizeAndPosition').and.returnValue(Observable.of());

    mockedDrawingsEventSource.resized.emit(drawingResizedDataEvent);

    expect(mockedDrawingService.updateSizeAndPosition).toHaveBeenCalled();
  });
});
