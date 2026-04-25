import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DuplicateActionComponent } from './duplicate-action.component';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DuplicateActionComponent', () => {
  let fixture: ComponentFixture<DuplicateActionComponent>;
  let component: DuplicateActionComponent;
  let mockNodeService: any;
  let mockDrawingService: any;
  let mockToasterService: any;
  let mockNodesDataSource: any;
  let mockDrawingsDataSource: any;
  let mockController: Controller;
  let mockProject: Project;
  let mockNode: Node;
  let mockDrawing: Drawing;

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      project_id: 'proj-1',
      name: 'Test Node',
      status: 'started',
      ...overrides,
    } as Node);

  const createMockDrawing = (overrides: Partial<Drawing> = {}): Drawing =>
    ({
      drawing_id: 'drawing-1',
      project_id: 'proj-1',
      svg: '<svg></svg>',
      ...overrides,
    } as Drawing);

  const createMockController = (): Controller =>
    ({
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
    } as Controller);

  const createMockProject = (): Project =>
    ({
      auto_close: false,
      auto_open: false,
      auto_start: false,
      drawing_grid_size: 25,
      filename: '',
      grid_size: 25,
      name: 'Test Project',
      path: '/test/path',
      project_id: 'proj-1',
      scene_height: 1000,
      scene_width: 1000,
      status: 'opened',
      readonly: false,
      show_interface_labels: false,
      show_layers: true,
      show_grid: true,
      snap_to_grid: true,
      variables: [],
    } as Project);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = {
      duplicate: vi.fn(),
    };

    mockDrawingService = {
      duplicate: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockNodesDataSource = {
      add: vi.fn(),
    };

    mockDrawingsDataSource = {
      add: vi.fn(),
    };

    mockController = createMockController();
    mockProject = createMockProject();
    mockNode = createMockNode();
    mockDrawing = createMockDrawing();

    await TestBed.configureTestingModule({
      imports: [DuplicateActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DuplicateActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Inputs', () => {
    it('should accept controller input', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.controller()).toBe(mockController);
    });

    it('should accept project input', () => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.detectChanges();

      expect(component.project()).toBe(mockProject);
    });

    it('should accept nodes input', () => {
      fixture.componentRef.setInput('nodes', [mockNode]);
      fixture.detectChanges();

      expect(component.nodes()).toEqual([mockNode]);
    });

    it('should accept drawings input', () => {
      fixture.componentRef.setInput('drawings', [mockDrawing]);
      fixture.detectChanges();

      expect(component.drawings()).toEqual([mockDrawing]);
    });

    it('should default nodes to empty array', () => {
      expect(component.nodes()).toEqual([]);
    });

    it('should default drawings to empty array', () => {
      expect(component.drawings()).toEqual([]);
    });
  });

  describe('duplicate', () => {
    describe('with nodes', () => {
      it('should call nodeService.duplicate for each node', () => {
        const node2 = createMockNode({ node_id: 'node-2', name: 'Node 2' });
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode, node2]);
        fixture.detectChanges();

        mockNodeService.duplicate.mockReturnValue(of(mockNode));

        component.duplicate();

        expect(mockNodeService.duplicate).toHaveBeenCalledWith(mockController, mockNode);
        expect(mockNodeService.duplicate).toHaveBeenCalledWith(mockController, node2);
        expect(mockNodeService.duplicate).toHaveBeenCalledTimes(2);
      });

      it('should add duplicated node to nodesDataSource on success', () => {
        const duplicatedNode = createMockNode({ node_id: 'node-1-copy', name: 'Test Node (copy)' });
        mockNodeService.duplicate.mockReturnValue(of(duplicatedNode));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode]);
        fixture.detectChanges();

        component.duplicate();

        expect(mockNodesDataSource.add).toHaveBeenCalledWith(duplicatedNode);
      });

      it('should show shutdown error message on 409 conflict status', () => {
        const error409 = { status: 409 };
        mockNodeService.duplicate.mockReturnValue(throwError(() => error409));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode]);
        fixture.detectChanges();

        component.duplicate();

        expect(mockToasterService.error).toHaveBeenCalledWith(`Shutdown ${mockNode.name} before duplicating`);
      });

      it('should show generic error message on non-409 error', () => {
        const error500 = { status: 500, message: 'Internal server error' };
        mockNodeService.duplicate.mockReturnValue(throwError(() => error500));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode]);
        fixture.detectChanges();

        component.duplicate();

        expect(mockToasterService.error).toHaveBeenCalledWith('Internal server error');
      });

      it('should not add node to nodesDataSource on error', () => {
        const error500 = { status: 500, message: 'Internal server error' };
        mockNodeService.duplicate.mockReturnValue(throwError(() => error500));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode]);
        fixture.detectChanges();

        component.duplicate();

        expect(mockNodesDataSource.add).not.toHaveBeenCalled();
      });

      it('should call markForCheck when nodeService.duplicate fails', async () => {
        mockNodeService.duplicate.mockReturnValue(throwError(() => ({ status: 500 })));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode]);
        fixture.detectChanges();

        const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
        component.duplicate();
        await vi.runAllTimersAsync();

        expect(cdrSpy).toHaveBeenCalled();
      });

      it('should use fallback message when node error has no message', async () => {
        mockNodeService.duplicate.mockReturnValue(throwError(() => ({})));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', [mockNode]);
        fixture.detectChanges();

        component.duplicate();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to duplicate node');
      });
    });

    describe('with drawings', () => {
      it('should call drawingService.duplicate for each drawing', () => {
        const drawing2 = createMockDrawing({ drawing_id: 'drawing-2' });
        mockDrawingService.duplicate.mockReturnValue(of(mockDrawing));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('drawings', [mockDrawing, drawing2]);
        fixture.detectChanges();

        component.duplicate();

        expect(mockDrawingService.duplicate).toHaveBeenCalledWith(mockController, mockDrawing.project_id, mockDrawing);
        expect(mockDrawingService.duplicate).toHaveBeenCalledWith(mockController, drawing2.project_id, drawing2);
        expect(mockDrawingService.duplicate).toHaveBeenCalledTimes(2);
      });

      it('should add duplicated drawing to drawingsDataSource on success', () => {
        const duplicatedDrawing = createMockDrawing({ drawing_id: 'drawing-1-copy' });
        mockDrawingService.duplicate.mockReturnValue(of(duplicatedDrawing));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('drawings', [mockDrawing]);
        fixture.detectChanges();

        component.duplicate();

        expect(mockDrawingsDataSource.add).toHaveBeenCalledWith(duplicatedDrawing);
      });

      it('should show error toast when drawingService.duplicate fails', async () => {
        mockDrawingService.duplicate.mockReturnValue(
          throwError(() => ({ error: { message: 'Failed to duplicate' } }))
        );
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('drawings', [mockDrawing]);
        fixture.detectChanges();

        component.duplicate();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to duplicate');
      });

      it('should use fallback message when drawing error has no message', async () => {
        mockDrawingService.duplicate.mockReturnValue(throwError(() => ({})));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('drawings', [mockDrawing]);
        fixture.detectChanges();

        component.duplicate();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to duplicate drawing');
      });

      it('should call markForCheck when drawingService.duplicate fails', async () => {
        mockDrawingService.duplicate.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('drawings', [mockDrawing]);
        fixture.detectChanges();

        const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
        component.duplicate();
        await vi.runAllTimersAsync();

        expect(cdrSpy).toHaveBeenCalled();
      });
    });

    describe('with empty inputs', () => {
      it('should not call nodeService.duplicate when nodes is empty', () => {
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('nodes', []);
        fixture.detectChanges();

        component.duplicate();

        expect(mockNodeService.duplicate).not.toHaveBeenCalled();
      });

      it('should not call drawingService.duplicate when drawings is empty', () => {
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('drawings', []);
        fixture.detectChanges();

        component.duplicate();

        expect(mockDrawingService.duplicate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Template', () => {
    it('should render duplicate button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Duplicate');
    });

    it('should call duplicate when button is clicked', () => {
      mockNodeService.duplicate.mockReturnValue(of(mockNode));
      mockDrawingService.duplicate.mockReturnValue(of(mockDrawing));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', [mockNode]);
      fixture.componentRef.setInput('drawings', [mockDrawing]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockNodeService.duplicate).toHaveBeenCalled();
      expect(mockDrawingService.duplicate).toHaveBeenCalled();
    });
  });
});
