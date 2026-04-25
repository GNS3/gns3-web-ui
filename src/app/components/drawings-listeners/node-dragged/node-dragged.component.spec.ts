import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { NodeDraggedComponent } from './node-dragged.component';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';

describe('NodeDraggedComponent', () => {
  let fixture: ComponentFixture<NodeDraggedComponent>;
  let component: NodeDraggedComponent;
  let mockNodesDataSource: any;
  let mockNodeService: any;
  let mockNodesEventSource: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let dragged$: Subject<DraggedDataEvent<MapNode>>;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'test-token',
    tokenExpired: false,
    location: 'local' as const,
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    status: 'running' as const,
    username: 'admin',
    password: 'password',
  };

  const mockProject: Project = {
    auto_close: false,
    auto_open: false,
    auto_start: false,
    drawing_grid_size: 25,
    filename: 'test.gns3',
    grid_size: 25,
    name: 'Test Project',
    path: '/projects/test',
    project_id: 'project-1',
    scene_height: 1000,
    scene_width: 1000,
    status: 'opened',
    show_interface_labels: true,
    show_layers: true,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
    readonly: false,
  } as Project;

  const createMockMapNode = (overrides: Partial<MapNode> = {}): MapNode =>
    ({
      id: 'node-1',
      x: 100,
      y: 200,
      ...overrides,
    } as MapNode);

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      x: 100,
      y: 200,
      ...overrides,
    } as Node);

  beforeEach(async () => {
    vi.clearAllMocks();

    dragged$ = new Subject<DraggedDataEvent<MapNode>>();

    mockNodeService = {
      updatePosition: vi.fn().mockReturnValue(of(createMockNode())),
    };

    mockNodesDataSource = {
      get: vi.fn(),
      update: vi.fn(),
    };

    mockNodesEventSource = {
      dragged: dragged$.asObservable(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NodeDraggedComponent],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: NodeService, useValue: mockNodeService },
        { provide: NodesEventSource, useValue: mockNodesEventSource },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeDraggedComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    dragged$.complete();
  });

  describe('component creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have controller and project as inputs', () => {
      fixture.detectChanges();
      expect(component.controller).toBeDefined();
      expect(component.project).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to nodesEventSource.dragged on init', () => {
      const subscribeSpy = vi.spyOn(mockNodesEventSource.dragged, 'subscribe');
      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe('onNodeDragged', () => {
    it('should update node position when drag event occurs', () => {
      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      mockNodesDataSource.get.mockReturnValue({ ...mockNode });

      component.onNodeDragged(dragEvent);

      expect(mockNodesDataSource.get).toHaveBeenCalledWith('node-1');
    });

    it('should calculate new position by adding dx and dy to node coordinates', () => {
      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);

      const nodeWithPosition = { ...mockNode };
      mockNodesDataSource.get.mockReturnValue(nodeWithPosition);

      component.onNodeDragged(dragEvent);

      expect(nodeWithPosition.x).toBe(150);
      expect(nodeWithPosition.y).toBe(230);
    });

    it('should call nodeService.updatePosition with correct parameters', () => {
      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);

      const nodeWithPosition = { ...mockNode };
      mockNodesDataSource.get.mockReturnValue(nodeWithPosition);

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);

      component.onNodeDragged(dragEvent);

      expect(mockNodeService.updatePosition).toHaveBeenCalledWith(
        mockController,
        mockProject,
        nodeWithPosition,
        150,
        230
      );
    });

    it('should update nodesDataSource when nodeService returns updated node', () => {
      const updatedNode = createMockNode({ node_id: 'node-1', x: 150, y: 230 });
      mockNodeService.updatePosition.mockReturnValue(of(updatedNode));

      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);

      const nodeWithPosition = { ...mockNode };
      mockNodesDataSource.get.mockReturnValue(nodeWithPosition);

      component.onNodeDragged(dragEvent);

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(updatedNode);
    });
  });

  describe('error handling', () => {
    it('should display error message when updatePosition fails with error.error.message', async () => {
      const errorMessage = 'Failed to update position: node locked';
      const mockError = {
        error: { message: errorMessage },
      };
      mockNodeService.updatePosition.mockReturnValue(throwError(() => mockError));

      fixture.detectChanges();
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      mockNodesDataSource.get.mockReturnValue({ ...mockNode });

      component.onNodeDragged(dragEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display error message when updatePosition fails with err.message', async () => {
      const errorMessage = 'Network connection failed';
      const error = new Error(errorMessage);
      mockNodeService.updatePosition.mockReturnValue(throwError(() => error));

      fixture.detectChanges();
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      mockNodesDataSource.get.mockReturnValue({ ...mockNode });

      component.onNodeDragged(dragEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith(errorMessage);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error message when error has no message', async () => {
      const error = {};
      mockNodeService.updatePosition.mockReturnValue(throwError(() => error));

      fixture.detectChanges();
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      mockNodesDataSource.get.mockReturnValue({ ...mockNode });

      component.onNodeDragged(dragEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node position');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should not update data source when updatePosition fails', async () => {
      const error = new Error('Update failed');
      mockNodeService.updatePosition.mockReturnValue(throwError(() => error));

      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      mockNodesDataSource.get.mockReturnValue({ ...mockNode });

      component.onNodeDragged(dragEvent);

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockNodesDataSource.update).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from nodeDragged', () => {
      fixture.detectChanges();
      const unsubscribeSpy = vi.spyOn(component['nodeDragged'], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not call updatePosition after component is destroyed', async () => {
      fixture.detectChanges();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);

      // Destroy the component (which unsubscribes)
      component.ngOnDestroy();

      // Clear previous calls
      vi.clearAllMocks();
      mockNodeService.updatePosition.mockClear();

      // Emit event through the event source after destruction
      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      dragged$.next(dragEvent);
      await vi.runAllTimersAsync();

      // Should not call updatePosition since subscription is cancelled
      expect(mockNodeService.updatePosition).not.toHaveBeenCalled();
    });
  });
});
