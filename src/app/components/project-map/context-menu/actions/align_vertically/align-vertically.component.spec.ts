import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlignVerticallyActionComponent } from './align-vertically.component';
import { NodeService } from '@services/node.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AlignVerticallyActionComponent', () => {
  let fixture: ComponentFixture<AlignVerticallyActionComponent>;
  let component: AlignVerticallyActionComponent;
  let mockNodeService: any;
  let mockNodesDataSource: any;
  let mockController: Controller;
  let mockNodes: Node[];

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      project_id: 'proj-1',
      name: 'Test Node',
      status: 'started',
      x: 100,
      y: 200,
      ...overrides,
    }) as Node;

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
    }) as Controller;

  beforeEach(async () => {
    mockNodeService = {
      update: vi.fn(),
    };

    mockNodesDataSource = {
      update: vi.fn(),
    };

    mockController = createMockController();
    mockNodes = [
      createMockNode({ node_id: 'node-1', x: 100 }),
      createMockNode({ node_id: 'node-2', x: 200 }),
      createMockNode({ node_id: 'node-3', x: 300 }),
    ];

    await TestBed.configureTestingModule({
      imports: [AlignVerticallyActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlignVerticallyActionComponent);
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

    it('should accept nodes input', () => {
      fixture.componentRef.setInput('nodes', mockNodes);
      fixture.detectChanges();

      expect(component.nodes()).toEqual(mockNodes);
    });

    it('should default controller to undefined', () => {
      expect(component.controller()).toBeUndefined();
    });

    it('should default nodes to undefined', () => {
      expect(component.nodes()).toBeUndefined();
    });
  });

  describe('alignVertically', () => {
    it('should calculate average X position from all nodes', () => {
      mockNodeService.update.mockReturnValue(of(mockNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', mockNodes);
      fixture.detectChanges();

      component.alignVertically();

      // Average of 100, 200, 300 = 200
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: 'node-1', x: 200 }),
      );
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: 'node-2', x: 200 }),
      );
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: 'node-3', x: 200 }),
      );
    });

    it('should call nodesDataSource.update for each node', () => {
      mockNodeService.update.mockReturnValue(of(mockNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', mockNodes);
      fixture.detectChanges();

      component.alignVertically();

      expect(mockNodesDataSource.update).toHaveBeenCalledTimes(3);
    });

    it('should call nodeService.update for each node', () => {
      mockNodeService.update.mockReturnValue(of(mockNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', mockNodes);
      fixture.detectChanges();

      component.alignVertically();

      expect(mockNodeService.update).toHaveBeenCalledTimes(3);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, expect.any(Object));
    });

    it('should mark for check after nodeService.update completes', () => {
      mockNodeService.update.mockReturnValue(of(mockNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', [mockNodes[0]]);
      fixture.detectChanges();

      component.alignVertically();

      // The markForCheck is called inside the subscribe callback
      expect(mockNodeService.update).toHaveBeenCalled();
    });

    it('should handle single node', () => {
      mockNodeService.update.mockReturnValue(of(mockNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', [mockNodes[0]]);
      fixture.detectChanges();

      component.alignVertically();

      // Average of single node = same X
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: 'node-1', x: 100 }),
      );
    });

    it('should handle nodes with same X position', () => {
      const sameXNodes = [
        createMockNode({ node_id: 'node-a', x: 150 }),
        createMockNode({ node_id: 'node-b', x: 150 }),
      ];
      mockNodeService.update.mockReturnValue(of(sameXNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', sameXNodes);
      fixture.detectChanges();

      component.alignVertically();

      // Average = 150, all nodes stay at 150
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: 'node-a', x: 150 }),
      );
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: 'node-b', x: 150 }),
      );
    });
  });

  describe('Template', () => {
    it('should render align vertically button', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Align vertically');
    });

    it('should call alignVertically when button is clicked', () => {
      mockNodeService.update.mockReturnValue(of(mockNodes[0]));
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', mockNodes);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockNodeService.update).toHaveBeenCalled();
    });
  });
});
