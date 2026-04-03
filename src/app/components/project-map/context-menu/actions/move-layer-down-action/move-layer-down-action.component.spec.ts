import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';
import { MoveLayerDownActionComponent } from './move-layer-down-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('MoveLayerDownActionComponent', () => {
  let component: MoveLayerDownActionComponent;
  let fixture: ComponentFixture<MoveLayerDownActionComponent>;
  let mockNodeService: { update: ReturnType<typeof vi.fn> };
  let mockDrawingService: { update: ReturnType<typeof vi.fn> };
  let mockNodesDataSource: { update: ReturnType<typeof vi.fn> };
  let mockDrawingsDataSource: { update: ReturnType<typeof vi.fn> };

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    authToken: 'token',
    status: 'running',
    tokenExpired: false,
  };

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'vpcs',
      project_id: 'proj1',
      command_line: '',
      compute_id: 'compute1',
      height: 50,
      width: 50,
      x: 0,
      y: 0,
      z: 5,
      label: { text: '', x: 0, y: 0, style: '', rotation: 0 },
      locked: false,
      first_port_name: '',
      port_name_format: '',
      port_segment_size: 1,
      ports: [],
      properties: {} as any,
      symbol: '',
      symbol_url: '',
      console: 0,
      console_auto_start: false,
      console_type: '',
      node_directory: '',
      ...overrides,
    }) as Node;

  const createMockDrawing = (overrides: Partial<Drawing> = {}): Drawing =>
    ({
      drawing_id: 'drawing-1',
      project_id: 'proj1',
      rotation: 0,
      svg: '<svg></svg>',
      locked: false,
      x: 100,
      y: 100,
      z: 10,
      element: null as any,
      ...overrides,
    }) as Drawing;

  beforeEach(async () => {
    mockNodeService = { update: vi.fn().mockReturnValue(of({})) };
    mockDrawingService = { update: vi.fn().mockReturnValue(of({})) };
    mockNodesDataSource = { update: vi.fn() };
    mockDrawingsDataSource = { update: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
      ],
    })
      .overrideProvider(NodeService, { useValue: mockNodeService })
      .overrideProvider(DrawingService, { useValue: mockDrawingService })
      .overrideProvider(NodesDataSource, { useValue: mockNodesDataSource })
      .overrideProvider(DrawingsDataSource, { useValue: mockDrawingsDataSource })
      .compileComponents();

    fixture = TestBed.createComponent(MoveLayerDownActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have moveLayerDown method', () => {
      expect(typeof component.moveLayerDown).toBe('function');
    });
  });

  describe('moveLayerDown', () => {
    it('should decrement z-index for each node', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1', z: 5 }),
        createMockNode({ node_id: 'node-2', z: 10 }),
      ];
      const drawings = [createMockDrawing({ drawing_id: 'drawing-1' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerDown();

      expect(nodes[0].z).toBe(4);
      expect(nodes[1].z).toBe(9);
    });

    it('should update nodesDataSource for each node', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1' }),
        createMockNode({ node_id: 'node-2' }),
      ];
      const drawings = [createMockDrawing({ drawing_id: 'drawing-1' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerDown();

      expect(mockNodesDataSource.update).toHaveBeenCalledTimes(2);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(nodes[0]);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(nodes[1]);
    });

    it('should call nodeService.update for each node', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1' }),
        createMockNode({ node_id: 'node-2' }),
      ];
      const drawings = [createMockDrawing({ drawing_id: 'drawing-1' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerDown();

      expect(mockNodeService.update).toHaveBeenCalledTimes(2);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should decrement z-index for each drawing', () => {
      const nodes = [createMockNode({ node_id: 'node-1' })];
      const drawings = [
        createMockDrawing({ drawing_id: 'drawing-1', z: 15 }),
        createMockDrawing({ drawing_id: 'drawing-2', z: 20 }),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerDown();

      expect(drawings[0].z).toBe(14);
      expect(drawings[1].z).toBe(19);
    });

    it('should update drawingsDataSource for each drawing', () => {
      const nodes = [createMockNode({ node_id: 'node-1' })];
      const drawings = [
        createMockDrawing({ drawing_id: 'drawing-1' }),
        createMockDrawing({ drawing_id: 'drawing-2' }),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerDown();

      expect(mockDrawingsDataSource.update).toHaveBeenCalledTimes(2);
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawings[0]);
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawings[1]);
    });

    it('should call drawingService.update for each drawing', () => {
      const nodes = [createMockNode({ node_id: 'node-1' })];
      const drawings = [
        createMockDrawing({ drawing_id: 'drawing-1' }),
        createMockDrawing({ drawing_id: 'drawing-2' }),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerDown();

      expect(mockDrawingService.update).toHaveBeenCalledTimes(2);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, drawings[0]);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, drawings[1]);
    });

    it('should handle empty nodes array', () => {
      const drawings = [createMockDrawing({ drawing_id: 'drawing-1' })];
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.moveLayerDown()).not.toThrow();
      expect(mockNodesDataSource.update).not.toHaveBeenCalled();
      expect(mockNodeService.update).not.toHaveBeenCalled();
    });

    it('should handle empty drawings array', () => {
      const nodes = [createMockNode({ node_id: 'node-1' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.moveLayerDown()).not.toThrow();
      expect(mockDrawingsDataSource.update).not.toHaveBeenCalled();
      expect(mockDrawingService.update).not.toHaveBeenCalled();
    });
  });
});
