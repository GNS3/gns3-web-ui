import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { TextAddedComponent } from './text-added.component';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '@services/drawing.service';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { Context } from '../../../cartography/models/context';
import { TextAddedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TextAddedComponent', () => {
  let component: TextAddedComponent;
  let fixture: ComponentFixture<TextAddedComponent>;

  let mockDrawingsEventSource: DrawingsEventSource;
  let mockDrawingsDataSource: any;
  let mockDrawingService: any;
  let mockDrawingsFactory: any;
  let mockMapDrawingToSvgConverter: any;
  let mockContext: any;

  let textAddedSubject: Subject<TextAddedDataEvent>;

  const mockController: Controller = {
    id: 1,
    authToken: '',
    name: 'Test Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  } as Controller;

  const mockProject: Project = {
    project_id: 'proj1',
    name: 'Test Project',
    filename: 'test.gns3',
    status: 'opened',
    auto_close: true,
    auto_open: false,
    auto_start: false,
    scene_width: 2000,
    scene_height: 1000,
    zoom: 100,
    show_layers: false,
    snap_to_grid: false,
    show_grid: false,
    grid_size: 75,
    drawing_grid_size: 25,
    show_interface_labels: false,
    variables: [],
    path: '/path/to/project',
    readonly: false,
  } as Project;

  const mockDrawing: Drawing = {
    drawing_id: 'draw1',
    project_id: 'proj1',
    rotation: 0,
    x: 100,
    y: 200,
    z: 1,
    svg: '<text>test</text>',
    locked: false,
    element: { text: 'Hello' } as TextElement,
  };

  const mockSvgText = '<text>Converted SVG</text>';

  beforeEach(async () => {
    textAddedSubject = new Subject<TextAddedDataEvent>();

    mockDrawingsDataSource = {
      add: vi.fn(),
    };

    mockDrawingService = {
      add: vi.fn().mockReturnValue(of(mockDrawing)),
    };

    mockDrawingsFactory = {
      getDrawingMock: vi.fn().mockReturnValue({ ...mockDrawing }),
    };

    mockMapDrawingToSvgConverter = {
      convert: vi.fn().mockReturnValue(mockSvgText),
    };

    mockContext = {
      transformation: { x: 10, y: 20, k: 2 },
      getZeroZeroTransformationPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    };

    // Use actual DrawingsEventSource with Subject for textAdded
    mockDrawingsEventSource = {
      textAdded: textAddedSubject,
    } as DrawingsEventSource;

    await TestBed.configureTestingModule({
      imports: [TextAddedComponent],
      providers: [
        { provide: DrawingsEventSource, useValue: mockDrawingsEventSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: DefaultDrawingsFactory, useValue: mockDrawingsFactory },
        { provide: MapDrawingToSvgConverter, useValue: mockMapDrawingToSvgConverter },
        { provide: Context, useValue: mockContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextAddedComponent);
    component = fixture.componentInstance;
    component.project = mockProject;
    fixture.componentRef.setInput('controller', mockController);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to textAdded events', () => {
      expect((component as any).textAdded).toBeDefined();
    });
  });

  describe('onTextAdded', () => {
    it('should create drawing with event text and convert to SVG', () => {
      const event = new TextAddedDataEvent('Hello World', 100, 200);

      component.onTextAdded(event);

      expect(mockDrawingsFactory.getDrawingMock).toHaveBeenCalledWith('text');
      expect(mockMapDrawingToSvgConverter.convert).toHaveBeenCalled();
    });

    it('should call drawingService.add with correct coordinates', () => {
      const event = new TextAddedDataEvent('Test Text', 100, 200);

      component.onTextAdded(event);

      // evt.x and evt.y are now canvas coordinates (no conversion needed)
      expect(mockDrawingService.add).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        100,
        200,
        mockSvgText
      );
    });

    it('should add drawing to data source on success', () => {
      const event = new TextAddedDataEvent('Test Text', 100, 200);

      component.onTextAdded(event);

      expect(mockDrawingsDataSource.add).toHaveBeenCalledWith(mockDrawing);
    });

    it('should emit drawingSaved event on success', () => {
      const event = new TextAddedDataEvent('Test Text', 100, 200);
      const emitSpy = vi.spyOn(component.drawingSaved, 'emit');

      component.onTextAdded(event);

      expect(emitSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = (component as any).textAdded;
      const unsubscribeSpy = vi.spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('textAdded event integration', () => {
    it('should process textAdded event through the full flow', () => {
      const event = new TextAddedDataEvent('Integrated Test', 150, 250);

      // Emit the event as the DrawingsEventSource would
      textAddedSubject.next(event);

      expect(mockDrawingsFactory.getDrawingMock).toHaveBeenCalledWith('text');
      expect(mockDrawingService.add).toHaveBeenCalled();
      expect(mockDrawingsDataSource.add).toHaveBeenCalledWith(mockDrawing);
    });
  });
});
