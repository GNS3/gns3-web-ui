import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NodeDraggedComponent } from './node-dragged.component';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { NodeService } from '@services/node.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';

describe('NodeDraggedComponent', () => {
  let fixture: ComponentFixture<NodeDraggedComponent>;
  let mockNodesDataSource: any;
  let mockNodeService: any;
  let mockNodesEventSource: any;
  let mockSubscription: any;

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
    readonly: false,
    show_interface_labels: true,
    show_layers: true,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
  };

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
    mockSubscription = { unsubscribe: vi.fn() };

    mockNodeService = {
      updatePosition: vi.fn().mockReturnValue(of(createMockNode())),
    };

    mockNodesDataSource = {
      get: vi.fn(),
      update: vi.fn(),
    };

    mockNodesEventSource = {
      dragged: {
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      },
    };

    await TestBed.configureTestingModule({
      imports: [NodeDraggedComponent],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: NodeService, useValue: mockNodeService },
        { provide: NodesEventSource, useValue: mockNodesEventSource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeDraggedComponent);
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('component creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should have controller and project as inputs', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.controller).toBeDefined();
      expect(fixture.componentInstance.project).toBeDefined();
    });
  });

  describe('initialization', () => {
    it('should subscribe to nodesEventSource.dragged on init', () => {
      fixture.detectChanges();
      expect(mockNodesEventSource.dragged.subscribe).toHaveBeenCalled();
    });
  });

  describe('onNodeDragged', () => {
    it('should update node position when drag event occurs', () => {
      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);
      mockNodesDataSource.get.mockReturnValue({ ...mockNode });

      const subscribeCallback = mockNodesEventSource.dragged.subscribe.mock.calls[0][0];
      subscribeCallback(dragEvent);

      expect(mockNodesDataSource.get).toHaveBeenCalledWith('node-1');
    });

    it('should calculate new position by adding dx and dy to node coordinates', () => {
      fixture.detectChanges();

      const mockNode = createMockMapNode({ id: 'node-1', x: 100, y: 200 });
      const dragEvent = new DraggedDataEvent(mockNode, 50, 30);

      const nodeWithPosition = { ...mockNode };
      mockNodesDataSource.get.mockReturnValue(nodeWithPosition);

      const subscribeCallback = mockNodesEventSource.dragged.subscribe.mock.calls[0][0];
      subscribeCallback(dragEvent);

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

      const subscribeCallback = mockNodesEventSource.dragged.subscribe.mock.calls[0][0];
      subscribeCallback(dragEvent);

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

      const subscribeCallback = mockNodesEventSource.dragged.subscribe.mock.calls[0][0];
      subscribeCallback(dragEvent);

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(updatedNode);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();

      // Subscription was already set up in ngOnInit, now verify it unsubscribes on destroy
      expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();

      fixture.destroy();
      fixture = null; // Prevent afterEach from trying to destroy again

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
