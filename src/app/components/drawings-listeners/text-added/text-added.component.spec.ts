import { TextAddedComponent } from './text-added.component';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { MockedDrawingService, MockedDrawingsDataSource } from '../../project-map/project-map.component.spec';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { Context } from '../../../cartography/models/context';
import { TextAddedDataEvent } from '../../../cartography/events/event-source';
import { Observable } from 'rxjs';
import { TextElementFactory } from '../../../cartography/helpers/drawings-factory/text-element-factory';
import { EllipseElementFactory } from '../../../cartography/helpers/drawings-factory/ellipse-element-factory';
import { RectangleElementFactory } from '../../../cartography/helpers/drawings-factory/rectangle-element-factory';
import { LineElementFactory } from '../../../cartography/helpers/drawings-factory/line-element-factory';
import { Project } from '../../../models/project';

describe('TextAddedComponent', () => {
  let component: TextAddedComponent;
  let fixture: ComponentFixture<TextAddedComponent>;
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
        { provide: MapDrawingToSvgConverter, useClass: MapDrawingToSvgConverter },
        { provide: Context, useClass: Context }
      ],
      declarations: [TextAddedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextAddedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call drawing service when text added', () => {
    component.project = { project_id: 'sampleId' } as Project;
    const textAddedDataEvent = new TextAddedDataEvent('savedText', 0, 0);
    spyOn(mockedDrawingService, 'add').and.returnValue(Observable.of({}));

    mockedDrawingsEventSource.textAdded.emit(textAddedDataEvent);

    expect(mockedDrawingService.add).toHaveBeenCalled();
  });
});
