import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuspendNodeActionComponent } from './suspend-node-action.component';
import { NodeService } from '@services/node.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

describe('SuspendNodeActionComponent', () => {
  let fixture: ComponentFixture<SuspendNodeActionComponent>;
  let component: SuspendNodeActionComponent;
  let mockNodeService: any;
  let mockController: Controller;

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      project_id: 'proj-1',
      name: 'Test Node',
      status: 'started',
      ...overrides,
    }) as Node;

  beforeEach(async () => {
    mockNodeService = {
      suspend: vi.fn().mockReturnValue(of({})),
    };

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

    await TestBed.configureTestingModule({
      imports: [SuspendNodeActionComponent],
      providers: [{ provide: NodeService, useValue: mockNodeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SuspendNodeActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have undefined isNodeWithStartedStatus initially', () => {
      expect(component.isNodeWithStartedStatus).toBeUndefined();
    });
  });

  describe('ngOnChanges - isNodeWithStartedStatus', () => {
    it('should set isNodeWithStartedStatus to true when any node has started status', () => {
      const nodes = [createMockNode({ status: 'started' }), createMockNode({ status: 'stopped' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStartedStatus).toBe(true);
    });

    it('should set isNodeWithStartedStatus to true when all nodes have started status', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1', status: 'started' }),
        createMockNode({ node_id: 'node-2', status: 'started' }),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStartedStatus).toBe(true);
    });

    it('should set isNodeWithStartedStatus to false when no node has started status', () => {
      const nodes = [createMockNode({ status: 'stopped' }), createMockNode({ status: 'suspended' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStartedStatus).toBe(false);
    });

    it('should set isNodeWithStartedStatus to false when nodes array is empty', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStartedStatus).toBe(false);
    });

    it('should re-evaluate when nodes input changes', () => {
      const startedNode = createMockNode({ status: 'started' });
      const stoppedNode = createMockNode({ status: 'stopped' });

      fixture.componentRef.setInput('nodes', [startedNode]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();
      expect(component.isNodeWithStartedStatus).toBe(true);

      fixture.componentRef.setInput('nodes', [stoppedNode]);
      fixture.detectChanges();
      expect(component.isNodeWithStartedStatus).toBe(false);
    });
  });

  describe('suspendNodes', () => {
    it('should call nodeService.suspend for each node', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1' }),
        createMockNode({ node_id: 'node-2' }),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.suspendNodes();

      expect(mockNodeService.suspend).toHaveBeenCalledTimes(2);
    });

    it('should call nodeService.suspend with controller and each node', () => {
      const node1 = createMockNode({ node_id: 'node-1' });
      const node2 = createMockNode({ node_id: 'node-2' });
      fixture.componentRef.setInput('nodes', [node1, node2]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.suspendNodes();

      expect(mockNodeService.suspend).toHaveBeenCalledWith(mockController, node1);
      expect(mockNodeService.suspend).toHaveBeenCalledWith(mockController, node2);
    });
  });

  describe('Template', () => {
    it('should show suspend button when isNodeWithStartedStatus is true', () => {
      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Suspend');
    });

    it('should hide suspend button when isNodeWithStartedStatus is false', () => {
      const nodes = [createMockNode({ status: 'stopped' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeFalsy();
    });

    it('should hide suspend button when nodes array is empty', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeFalsy();
    });

    it('should call suspendNodes when button is clicked', () => {
      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockNodeService.suspend).toHaveBeenCalled();
    });
  });
});
