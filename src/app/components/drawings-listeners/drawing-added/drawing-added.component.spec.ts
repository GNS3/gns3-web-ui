import { DrawingAddedComponent } from './drawing-added.component';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { MockedDrawingService, MockedDrawingsDataSource } from '../../project-map/project-map.component.spec';
import { TextElementFactory } from '../../../cartography/helpers/drawings-factory/text-element-factory';
import { EllipseElementFactory } from '../../../cartography/helpers/drawings-factory/ellipse-element-factory';
import { RectangleElementFactory } from '../../../cartography/helpers/drawings-factory/rectangle-element-factory';
import { LineElementFactory } from '../../../cartography/helpers/drawings-factory/line-element-factory';
import { Project } from '../../../models/project';
import { AddedDataEvent } from '../../../cartography/events/event-source';
import { Observable } from 'rxjs';

describe('DrawingAddedComponent', () => {
  let component: DrawingAddedComponent;
  let fixture: ComponentFixture<DrawingAddedComponent>;
  let mockedDrawingService = new MockedDrawingService();
  let mockedDrawingsDataSource = new MockedDrawingsDataSource();
  let mockedDrawingsEventSource = new DrawingsEventSource();
  let mockedDrawingsFactory = new DefaultDrawingsFactory(
    new TextElementFactory(),
    new EllipseElementFactory(),
    new RectangleElementFactory(),
    new LineElementFactory()
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DrawingService, useValue: mockedDrawingService },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockedDrawingsEventSource },
        { provide: DefaultDrawingsFactory, useValue: mockedDrawingsFactory },
        { provide: MapDrawingToSvgConverter, useClass: MapDrawingToSvgConverter }
      ],
      declarations: [DrawingAddedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingAddedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call drawing service when point to add drawing selected', () => {
    component.project = { project_id: 'sampleId' } as Project;
    component.selectedDrawing = 'rectangle';
    const pointToAddSelectedDataEvent = new AddedDataEvent(0, 0);
    spyOn(mockedDrawingService, 'add').and.returnValue(Observable.of({}));

    mockedDrawingsEventSource.pointToAddSelected.emit(pointToAddSelectedDataEvent);

    expect(mockedDrawingService.add).toHaveBeenCalled();
  });
});
