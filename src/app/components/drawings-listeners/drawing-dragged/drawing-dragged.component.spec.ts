import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { DrawingDraggedComponent } from './drawing-dragged.component';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Drawing } from '../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { of, Subject, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DrawingDraggedComponent', () => {
  let fixture: ComponentFixture<DrawingDraggedComponent>;
  let component: DrawingDraggedComponent;
  let drawingsEventSource: DrawingsEventSource;
  let drawingsDataSource: DrawingsDataSource;
  let mockDrawingService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  let draggedEvent$ = new Subject<DraggedDataEvent<MapDrawing>>();

  let mockController: Controller;
  let mockProject: Project;

  const createMockDrawing = (): Drawing => ({
    drawing_id: 'drawing-1',
    project_id: 'project-1',
    svg: '<svg>test</svg>',
    x: 100,
    y: 200,
    z: 1,
    locked: false,
    rotation: 0,
    element: null as any,
  });

  const createMockMapDrawing = (): MapDrawing => ({
    id: 'drawing-1',
    projectId: 'project-1',
    rotation: 0,
    svg: '<svg>test</svg>',
    locked: false,
    x: 100,
    y: 200,
    z: 1,
    element: null as any,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
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
      project_id: 'project-1',
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
      updatePosition: vi.fn().mockReturnValue(of(createMockDrawing())),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DrawingDraggedComponent],
      providers: [
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        DrawingsDataSource,
        DrawingsEventSource,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawingDraggedComponent);
    component = fixture.componentInstance;

    drawingsEventSource = TestBed.inject(DrawingsEventSource);
    drawingsDataSource = TestBed.inject(DrawingsDataSource);

    // Override the event source to use our test subject
    (drawingsEventSource as any).dragged = draggedEvent$.asObservable();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    draggedEvent$.complete();
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to dragged event on init', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const subscribeSpy = vi.spyOn(drawingsEventSource.dragged, 'subscribe');
      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe('onDrawingDragged', () => {
    it('should update drawing position when dragged event is emitted', () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);

      // Mock should return updated drawing with new coordinates
      const updatedDrawing: Drawing = { ...mockDrawing, x: 110, y: 220 };
      mockDrawingService.updatePosition.mockReturnValue(of(updatedDrawing));

      component.onDrawingDragged(draggedEvent);
      fixture.detectChanges();

      const resultDrawing = drawingsDataSource.get('drawing-1') as Drawing;
      expect(resultDrawing.x).toBe(110);
      expect(resultDrawing.y).toBe(220);
    });

    it('should call drawingService.updatePosition with correct parameters', () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 5, 15);

      component.onDrawingDragged(draggedEvent);

      expect(mockDrawingService.updatePosition).toHaveBeenCalledWith(
        mockController,
        mockProject,
        expect.any(Object),
        105,
        215
      );
    });

    it('should update data source when updatePosition succeeds', () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const updatedDrawing: Drawing = { ...mockDrawing, x: 150, y: 250 };
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 50, 50);
      mockDrawingService.updatePosition.mockReturnValue(of(updatedDrawing));

      const updateSpy = vi.spyOn(drawingsDataSource, 'update');

      component.onDrawingDragged(draggedEvent);
      fixture.detectChanges();

      expect(updateSpy).toHaveBeenCalledWith(updatedDrawing);
    });
  });

  describe('error handling', () => {
    it('should display error message when updatePosition fails with error.error.message', async () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const errorMessage = 'Failed to update position: drawing locked';
      const mockError = {
        error: { message: errorMessage },
      };
      mockDrawingService.updatePosition.mockReturnValue(throwError(() => mockError));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);

      component.onDrawingDragged(draggedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display error message when updatePosition fails with err.message', async () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const errorMessage = 'Network connection failed';
      const error = new Error(errorMessage);
      mockDrawingService.updatePosition.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);

      component.onDrawingDragged(draggedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error message when error has no message', async () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const error = {};
      mockDrawingService.updatePosition.mockReturnValue(throwError(() => error));

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);

      component.onDrawingDragged(draggedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update drawing position');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should not update data source when updatePosition fails', async () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const error = new Error('Update failed');
      mockDrawingService.updatePosition.mockReturnValue(throwError(() => error));

      const updateSpy = vi.spyOn(drawingsDataSource, 'update');
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);

      component.onDrawingDragged(draggedEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from drawingDragged', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      const unsubscribeSpy = vi.spyOn(component['drawingDragged'], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not call updatePosition after component is destroyed', async () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      // Destroy the component (which unsubscribes)
      component.ngOnDestroy();

      // Clear previous calls
      vi.clearAllMocks();
      mockDrawingService.updatePosition.mockClear();

      // Emit event through the event source after destruction
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);
      draggedEvent$.next(draggedEvent);
      await vi.runAllTimersAsync();

      // Should not call updatePosition since subscription is cancelled
      expect(mockDrawingService.updatePosition).not.toHaveBeenCalled();
    });
  });
});
