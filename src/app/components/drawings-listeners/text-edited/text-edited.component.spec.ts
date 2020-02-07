import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { TextEditedDataEvent } from '../../../cartography/events/event-source';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { DrawingService } from '../../../services/drawing.service';
import { MockedDrawingsDataSource, MockedDrawingService } from '../../project-map/project-map.component.spec';
import { TextEditedComponent } from './text-edited.component';

describe('TextEditedComponent', () => {
  let component: TextEditedComponent;
  let fixture: ComponentFixture<TextEditedComponent>;
  const mockedDrawingService = new MockedDrawingService();
  const mockedDrawingsDataSource = new MockedDrawingsDataSource();
  const mockedDrawingsEventSource = new DrawingsEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DrawingService, useValue: mockedDrawingService },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockedDrawingsEventSource },
        { provide: MapDrawingToSvgConverter, useClass: MapDrawingToSvgConverter }
      ],
      declarations: [TextEditedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextEditedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should  create', () => {
    expect(component).toBeTruthy();
  });

  it('should call drawing service when text edited', () => {
    const textElement: TextElement = {
      height: 100,
      width: 100,
      text: 'sample text',
      fill: 'fill',
      fill_opacity: 100,
      font_family: 'font',
      font_size: 100,
      font_weight: 'bold',
      text_decoration: 'sample decoration'
    };
    const textEditedDataEvent = new TextEditedDataEvent('id', 'edited text', textElement);
    spyOn(mockedDrawingService, 'updateText').and.returnValue(Observable.of());

    mockedDrawingsEventSource.textEdited.emit(textEditedDataEvent);

    expect(mockedDrawingService.updateText).toHaveBeenCalled();
  });
});
