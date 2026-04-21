import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MoveLayerUpActionComponent } from './move-layer-up-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';

describe('MoveLayerUpActionComponent', () => {
  let component: MoveLayerUpActionComponent;
  let fixture: ComponentFixture<MoveLayerUpActionComponent>;
  let mockNodeService: { update: ReturnType<typeof vi.fn> };
  let mockDrawingService: { update: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockNodesDataSource: { update: ReturnType<typeof vi.fn> };
  let mockDrawingsDataSource: { update: ReturnType<typeof vi.fn> };
  let mockCdr: { markForCheck: ReturnType<typeof vi.fn> };

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

  const createMockNode = (z = 0): Node => ({
    node_id: `node-${z}`,
    name: `Node ${z}`,
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
    z,
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
  });

  const createMockDrawing = (z = 0): Drawing => ({
    drawing_id: `drawing-${z}`,
    project_id: 'proj1',
    rotation: 0,
    svg: '<svg></svg>',
    locked: false,
    x: 0,
    y: 0,
    z,
    element: { type: 'rect' } as any,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = { update: vi.fn().mockReturnValue(of({})) };
    mockDrawingService = { update: vi.fn().mockReturnValue(of({})) };
    mockToasterService = { error: vi.fn() };
    mockNodesDataSource = { update: vi.fn() };
    mockDrawingsDataSource = { update: vi.fn() };
    mockCdr = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MoveLayerUpActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveLayerUpActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('moveLayerUp', () => {
    it('should increment z value of each node by 1', () => {
      const nodes = [createMockNode(0), createMockNode(1)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(nodes[0].z).toBe(1);
      expect(nodes[1].z).toBe(2);
    });

    it('should increment z value of each drawing by 1', () => {
      const drawings = [createMockDrawing(0), createMockDrawing(1)];
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(drawings[0].z).toBe(1);
      expect(drawings[1].z).toBe(2);
    });

    it('should call nodesDataSource.update for each node', () => {
      const nodes = [createMockNode(0), createMockNode(1)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockNodesDataSource.update).toHaveBeenCalledTimes(2);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(nodes[0]);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(nodes[1]);
    });

    it('should call nodeService.update for each node', () => {
      const nodes = [createMockNode(0), createMockNode(1)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockNodeService.update).toHaveBeenCalledTimes(2);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should call drawingsDataSource.update for each drawing', () => {
      const drawings = [createMockDrawing(0), createMockDrawing(1)];
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockDrawingsDataSource.update).toHaveBeenCalledTimes(2);
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawings[0]);
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawings[1]);
    });

    it('should call drawingService.update for each drawing', () => {
      const drawings = [createMockDrawing(0), createMockDrawing(1)];
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockDrawingService.update).toHaveBeenCalledTimes(2);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, drawings[0]);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, drawings[1]);
    });
  });

  describe('button click', () => {
    it('should call moveLayerUp when button is clicked', () => {
      const nodes = [createMockNode(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      const moveLayerUpSpy = vi.spyOn(component, 'moveLayerUp');

      button.click();

      expect(moveLayerUpSpy).toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have moveLayerUp method', () => {
      expect(typeof component.moveLayerUp).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle node service error and show toaster', () => {
      const errorResponse = { error: { message: 'Network error' } };
      mockNodeService.update.mockReturnValue(throwError(errorResponse));
      const nodes = [createMockNode(0)];
      const drawings: Drawing[] = [];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
    });

    it('should handle drawing service error and show toaster', () => {
      const errorResponse = { error: { message: 'Drawing update failed' } };
      mockDrawingService.update.mockReturnValue(throwError(errorResponse));
      const nodes: Node[] = [];
      const drawings = [createMockDrawing(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockToasterService.error).toHaveBeenCalledWith('Drawing update failed');
    });

    it('should use default error message when error has no message', () => {
      mockNodeService.update.mockReturnValue(throwError({}));
      const nodes = [createMockNode(0)];
      const drawings: Drawing[] = [];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.moveLayerUp();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to move layer up');
    });

    it('should handle empty nodes array', () => {
      const drawings = [createMockDrawing(0)];
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.moveLayerUp()).not.toThrow();
      expect(mockNodesDataSource.update).not.toHaveBeenCalled();
      expect(mockNodeService.update).not.toHaveBeenCalled();
    });

    it('should handle empty drawings array', () => {
      const nodes = [createMockNode(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.moveLayerUp()).not.toThrow();
      expect(mockDrawingsDataSource.update).not.toHaveBeenCalled();
      expect(mockDrawingService.update).not.toHaveBeenCalled();
    });
  });
});
