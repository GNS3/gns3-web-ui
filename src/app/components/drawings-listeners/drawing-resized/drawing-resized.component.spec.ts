import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { DrawingResizedComponent } from './drawing-resized.component';
import { DrawingService } from '@services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { ToasterService } from '@services/toaster.service';
import { ResizedDataEvent } from '../../../cartography/events/event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Drawing } from '../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DrawingResizedComponent', () => {
  let fixture: ComponentFixture<DrawingResizedComponent>;
  let component: DrawingResizedComponent;
  let mockDrawingService: any;
  let mockDrawingsDataSource: any;
  let mockDrawingsEventSource: any;
  let mockMapDrawingToSvgConverter: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let resizedSubject: Subject<ResizedDataEvent<MapDrawing>>;
  let mockController: Controller;
  let mockProject: Project;

  const createMockMapDrawing = (id: string): MapDrawing => ({
    id,
    projectId: 'proj1',
    rotation: 0,
    svg: '<svg>original</svg>',
    locked: false,
    x: 100,
    y: 200,
    z: 1,
    element: {
      type: 'rect',
      fill: '#ffffff',
      fill_opacity: 1,
      height: 50,
      width: 100,
      stroke: '',
      stroke_dasharray: '',
      stroke_width: 0,
      rx: 0,
      ry: 0,
    } as any,
  });

  const createMockDrawing = (id: string): Drawing => ({
    drawing_id: id,
    project_id: 'proj1',
    rotation: 0,
    svg: '<svg>original</svg>',
    locked: false,
    x: 100,
    y: 200,
    z: 1,
    element: null as any,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    resizedSubject = new Subject<ResizedDataEvent<MapDrawing>>();

    mockController = {
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

    mockProject = {
      project_id: 'proj1',
      name: 'Test Project',
      filename: 'test.gns3',
      snap_to_grid: false,
      drawing_grid_size: 50,
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_grid: false,
      show_interface_labels: true,
      show_layers: false,
      grid_size: 75,
    } as unknown as Project;

    mockDrawingService = {
      updateSizeAndPosition: vi.fn().mockReturnValue(of(createMockDrawing('d1'))),
    };

    mockDrawingsDataSource = {
      get: vi.fn().mockReturnValue(createMockDrawing('d1')),
      update: vi.fn(),
    };

    mockDrawingsEventSource = {
      resized: resizedSubject.asObservable(),
    };

    mockMapDrawingToSvgConverter = {
      convert: vi.fn().mockReturnValue('<svg>converted</svg>'),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DrawingResizedComponent],
      providers: [
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockDrawingsEventSource },
        { provide: MapDrawingToSvgConverter, useValue: mockMapDrawingToSvgConverter },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawingResizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    resizedSubject.complete();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have undefined controller initially', () => {
      expect(component.controller()).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to drawingsEventSource.resized', () => {
      const subscribeSpy = vi.spyOn(mockDrawingsEventSource.resized, 'subscribe');
      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should get drawing from dataSource when resize event is emitted', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      resizedSubject.next(new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150));

      expect(mockDrawingsDataSource.get).toHaveBeenCalledWith('d1');
    });
  });

  describe('onDrawingResized', () => {
    beforeEach(() => {
      mockDrawingsDataSource.get.mockReturnValue(createMockDrawing('d1'));
      mockDrawingService.updateSizeAndPosition.mockReturnValue(of(createMockDrawing('d1')));
    });

    it('should get drawing from dataSource using resized event datum id', () => {
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      expect(mockDrawingsDataSource.get).toHaveBeenCalledWith('d1');
    });

    it('should convert mapDrawing to SVG string', () => {
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      expect(mockMapDrawingToSvgConverter.convert).toHaveBeenCalled();
    });

    it('should call drawingService.updateSizeAndPosition with correct parameters', () => {
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      expect(mockDrawingService.updateSizeAndPosition).toHaveBeenCalledWith(
        undefined,
        createMockDrawing('d1'),
        resizedEvent.x,
        resizedEvent.y,
        '<svg>converted</svg>'
      );
    });

    it('should update drawingsDataSource with returned drawing after API call', () => {
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);
      const updatedDrawing = { ...createMockDrawing('d1'), x: 150, y: 250 };
      mockDrawingService.updateSizeAndPosition.mockReturnValue(of(updatedDrawing));

      component.onDrawingResized(resizedEvent);

      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(updatedDrawing);
    });

    it('should handle controller being undefined', () => {
      fixture.componentRef.setInput('controller', undefined);
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      expect(mockDrawingService.updateSizeAndPosition).toHaveBeenCalledWith(
        undefined,
        createMockDrawing('d1'),
        resizedEvent.x,
        resizedEvent.y,
        '<svg>converted</svg>'
      );
    });
  });

  describe('error handling', () => {
    it('should display error message when updateSizeAndPosition fails with error.error.message', async () => {
      const errorMessage = 'Failed to update size: drawing locked';
      const mockError = {
        error: { message: errorMessage },
      };
      mockDrawingService.updateSizeAndPosition.mockReturnValue(throwError(() => mockError));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display error message when updateSizeAndPosition fails with err.message', async () => {
      const errorMessage = 'Network connection failed';
      const error = new Error(errorMessage);
      mockDrawingService.updateSizeAndPosition.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error message when error has no message', async () => {
      const error = {};
      mockDrawingService.updateSizeAndPosition.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);

      component.onDrawingResized(resizedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update drawing size');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should not update data source when updateSizeAndPosition fails', async () => {
      const error = new Error('Update failed');
      mockDrawingService.updateSizeAndPosition.mockReturnValue(throwError(() => error));

      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);
      component.onDrawingResized(resizedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockDrawingsDataSource.update).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from drawingResized', () => {
      const unsubscribeSpy = vi.spyOn(component['drawingResized'], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not call updateSizeAndPosition after component is destroyed', async () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Destroy the component (which unsubscribes)
      component.ngOnDestroy();

      // Clear previous calls
      vi.clearAllMocks();
      mockDrawingService.updateSizeAndPosition.mockClear();

      // Emit event through the event source after destruction
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('d1'), 150, 250, 200, 150);
      resizedSubject.next(resizedEvent);
      await vi.runAllTimersAsync();

      // Should not call updateSizeAndPosition since subscription is cancelled
      expect(mockDrawingService.updateSizeAndPosition).not.toHaveBeenCalled();
    });
  });

  describe('Integration: full resize flow', () => {
    it('should handle complete resize event flow from subscription to dataSource update', () => {
      const mapDrawing = createMockMapDrawing('d2');
      const drawing = createMockDrawing('d2');
      const updatedDrawing = { ...drawing, x: 300, y: 400 };

      mockDrawingsDataSource.get.mockReturnValue(drawing);
      mockDrawingService.updateSizeAndPosition.mockReturnValue(of(updatedDrawing));
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      resizedSubject.next(new ResizedDataEvent(mapDrawing, 300, 400, 250, 200));

      expect(mockDrawingsDataSource.get).toHaveBeenCalledWith('d2');
      expect(mockMapDrawingToSvgConverter.convert).toHaveBeenCalledWith(mapDrawing);
      expect(mockDrawingService.updateSizeAndPosition).toHaveBeenCalled();
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(updatedDrawing);
    });

    it('should handle resize event when drawing is not found in dataSource', () => {
      mockDrawingsDataSource.get.mockReturnValue(undefined);
      const resizedEvent = new ResizedDataEvent(createMockMapDrawing('nonexistent'), 100, 100, 50, 50);

      component.onDrawingResized(resizedEvent);

      expect(mockDrawingService.updateSizeAndPosition).toHaveBeenCalled();
    });
  });
});
