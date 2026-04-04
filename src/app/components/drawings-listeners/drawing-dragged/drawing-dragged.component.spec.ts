import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawingDraggedComponent } from './drawing-dragged.component';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DrawingService } from '@services/drawing.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Drawing } from '../../../cartography/models/drawing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DrawingDraggedComponent', () => {
  let fixture: ComponentFixture<DrawingDraggedComponent>;
  let drawingsEventSource: DrawingsEventSource;
  let drawingsDataSource: DrawingsDataSource;
  let mockDrawingService: any;

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
    mockDrawingService = {
      updatePosition: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DrawingDraggedComponent],
      providers: [
        DrawingsEventSource,
        DrawingsDataSource,
        { provide: DrawingService, useValue: mockDrawingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawingDraggedComponent);
    drawingsEventSource = TestBed.inject(DrawingsEventSource);
    drawingsDataSource = TestBed.inject(DrawingsDataSource);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe('subscription behavior', () => {
    it('should subscribe to dragged event on init', () => {
      const subscribeSpy = vi.spyOn(drawingsEventSource.dragged, 'subscribe');
      fixture.detectChanges();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();
      const subscription = (fixture.componentInstance as any).drawingDragged;
      const unsubscribeSpy = vi.spyOn(subscription, 'unsubscribe');
      fixture.destroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('onDrawingDragged', () => {
    it('should update drawing position when dragged event is emitted', () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.detectChanges();

      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 10, 20);
      mockDrawingService.updatePosition.mockReturnValue(of(mockDrawing));

      fixture.componentInstance.onDrawingDragged(draggedEvent);

      const updatedDrawing = drawingsDataSource.get('drawing-1') as Drawing;
      expect(updatedDrawing.x).toBe(110);
      expect(updatedDrawing.y).toBe(220);
    });

    it('should call drawingService.updatePosition with drawing and new coordinates', () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.detectChanges();

      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 5, 15);
      mockDrawingService.updatePosition.mockReturnValue(of(mockDrawing));

      fixture.componentInstance.onDrawingDragged(draggedEvent);

      expect(mockDrawingService.updatePosition).toHaveBeenCalledWith(
        undefined,
        undefined,
        expect.any(Object),
        105,
        215,
      );
    });

    it('should update data source when updatePosition returns', () => {
      const mockDrawing = createMockDrawing();
      drawingsDataSource.add(mockDrawing);
      fixture.detectChanges();

      const updatedDrawing: Drawing = { ...mockDrawing, x: 150, y: 250 };
      const draggedEvent = new DraggedDataEvent(createMockMapDrawing(), 50, 50);
      mockDrawingService.updatePosition.mockReturnValue(of(updatedDrawing));

      const updateSpy = vi.spyOn(drawingsDataSource, 'update');

      fixture.componentInstance.onDrawingDragged(draggedEvent);
      fixture.detectChanges();

      expect(updateSpy).toHaveBeenCalledWith(updatedDrawing);
    });
  });
});
