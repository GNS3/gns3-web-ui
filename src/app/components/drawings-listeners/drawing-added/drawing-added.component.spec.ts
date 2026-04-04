import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { DrawingAddedComponent } from './drawing-added.component';
import { DrawingService } from '@services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { AddedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DrawingAddedComponent', () => {
  let component: DrawingAddedComponent;
  let fixture: ComponentFixture<DrawingAddedComponent>;

  let mockDrawingService: any;
  let mockDrawingsDataSource: any;
  let mockDrawingsEventSource: any;
  let mockDrawingsFactory: any;
  let mockMapDrawingToSvgConverter: any;
  let mockChangeDetectorRef: any;

  let pointToAddSelected$ = new Subject<AddedDataEvent>();

  let mockController: Controller;
  let mockProject: Project;
  let mockDrawing: Drawing;

  beforeEach(async () => {
    mockDrawingService = {
      add: vi.fn().mockReturnValue(of(mockDrawing)),
    };

    mockDrawingsDataSource = {
      add: vi.fn(),
    };

    mockDrawingsEventSource = {
      pointToAddSelected: pointToAddSelected$.asObservable(),
      selected: {
        emit: vi.fn(),
      },
    };

    mockDrawingsFactory = {
      getDrawingMock: vi.fn().mockReturnValue({ element: {} }),
    };

    mockMapDrawingToSvgConverter = {
      convert: vi.fn().mockReturnValue('<svg>test</svg>'),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

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
      project_id: 'project-123',
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

    mockDrawing = {
      drawing_id: 'drawing-1',
      project_id: 'project-123',
      svg: '<svg>test</svg>',
      x: 100,
      y: 200,
      z: 1,
      rotation: 0,
      locked: false,
    } as Drawing;

    await TestBed.configureTestingModule({
      imports: [DrawingAddedComponent],
      providers: [
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockDrawingsEventSource },
        { provide: DefaultDrawingsFactory, useValue: mockDrawingsFactory },
        { provide: MapDrawingToSvgConverter, useValue: mockMapDrawingToSvgConverter },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawingAddedComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    pointToAddSelected$.complete();
  });

  describe('ngOnInit', () => {
    it('should subscribe to pointToAddSelected event', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component.selectedDrawing = 'rectangle';
      fixture.detectChanges();

      pointToAddSelected$.next(new AddedDataEvent(100, 200));

      expect(mockDrawingService.add).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges - selectedDrawing', () => {
    it('should emit drawingsEventSource.selected when selectedDrawing changes to non-text value', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      component.selectedDrawing = 'rectangle';
      component.ngOnChanges({
        selectedDrawing: {
          currentValue: 'rectangle',
          previousValue: undefined,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(mockDrawingsEventSource.selected.emit).toHaveBeenCalledWith('rectangle');
    });

    it('should NOT emit drawingsEventSource.selected when selectedDrawing changes to text', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      component.selectedDrawing = 'text';
      component.ngOnChanges({
        selectedDrawing: {
          currentValue: 'text',
          previousValue: undefined,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(mockDrawingsEventSource.selected.emit).not.toHaveBeenCalled();
    });

    it('should not react to first change of selectedDrawing', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      component.ngOnChanges({
        selectedDrawing: {
          currentValue: 'rectangle',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(mockDrawingsEventSource.selected.emit).not.toHaveBeenCalled();
    });
  });

  describe('onDrawingSaved', () => {
    it('should call drawingService.add with correct parameters', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component.selectedDrawing = 'rectangle';
      fixture.detectChanges(); // This triggers ngOnInit

      const event = new AddedDataEvent(100, 200);
      component.onDrawingSaved(event);

      expect(mockDrawingsFactory.getDrawingMock).toHaveBeenCalledWith('rectangle');
      expect(mockMapDrawingToSvgConverter.convert).toHaveBeenCalled();
      expect(mockDrawingService.add).toHaveBeenCalledWith(
        mockController,
        mockProject.project_id,
        100,
        200,
        '<svg>test</svg>'
      );
    });

    it('should add drawing to data source on successful save', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component.selectedDrawing = 'rectangle';
      fixture.detectChanges(); // This triggers ngOnInit

      const event = new AddedDataEvent(100, 200);
      component.onDrawingSaved(event);
      fixture.detectChanges(); // Wait for observable to emit

      expect(mockDrawingsDataSource.add).toHaveBeenCalledWith(mockDrawing);
    });

    it('should emit drawingSaved event on successful save', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component.selectedDrawing = 'rectangle';
      fixture.detectChanges(); // This triggers ngOnInit

      const drawingSavedSpy = vi.spyOn(component.drawingSaved, 'emit');

      const event = new AddedDataEvent(100, 200);
      component.onDrawingSaved(event);
      fixture.detectChanges();

      expect(drawingSavedSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from pointToAddSelected', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component.selectedDrawing = 'rectangle';
      fixture.detectChanges();

      fixture.destroy();

      // If subscription is not cleaned up, this would cause an error
      pointToAddSelected$.next(new AddedDataEvent(100, 200));
      expect(mockDrawingService.add).not.toHaveBeenCalled();
    });
  });
});
