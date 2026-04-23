import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { TextAddedComponent } from './text-added.component';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
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
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
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
    vi.clearAllMocks();

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

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
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
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
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
    textAddedSubject.complete();
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

  describe('error handling', () => {
    it('should display error message when add fails with error.error.message', async () => {
      const errorMessage = 'Failed to create text: insufficient space';
      const mockError = {
        error: { message: errorMessage },
      };
      mockDrawingService.add.mockReturnValue(throwError(() => mockError));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const event = new TextAddedDataEvent('Test Text', 100, 200);

      component.onTextAdded(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display error message when add fails with err.message', async () => {
      const errorMessage = 'Network connection failed';
      const error = new Error(errorMessage);
      mockDrawingService.add.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const event = new TextAddedDataEvent('Test Text', 100, 200);

      component.onTextAdded(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error message when error has no message', async () => {
      const error = {};
      mockDrawingService.add.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const event = new TextAddedDataEvent('Test Text', 100, 200);

      component.onTextAdded(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to create text drawing');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should not add drawing to data source when add fails', async () => {
      const error = new Error('Creation failed');
      mockDrawingService.add.mockReturnValue(throwError(() => error));

      const event = new TextAddedDataEvent('Test Text', 100, 200);
      component.onTextAdded(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockDrawingsDataSource.add).not.toHaveBeenCalled();
    });

    it('should not emit drawingSaved event when add fails', async () => {
      const error = new Error('Creation failed');
      mockDrawingService.add.mockReturnValue(throwError(() => error));

      const event = new TextAddedDataEvent('Test Text', 100, 200);
      const emitSpy = vi.spyOn(component.drawingSaved, 'emit');

      component.onTextAdded(event);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from textAdded', () => {
      const unsubscribeSpy = vi.spyOn(component['textAdded'], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not call drawingService.add after component is destroyed', async () => {
      // Destroy the component (which unsubscribes)
      component.ngOnDestroy();

      // Clear previous calls
      vi.clearAllMocks();
      mockDrawingService.add.mockClear();

      // Emit event through the event source after destruction
      const event = new TextAddedDataEvent('Test Text', 100, 200);
      textAddedSubject.next(event);
      await vi.runAllTimersAsync();

      // Should not call add since subscription is cancelled
      expect(mockDrawingService.add).not.toHaveBeenCalled();
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
