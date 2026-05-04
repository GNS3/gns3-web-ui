import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { StopNodeActionComponent } from './stop-node-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { ProgressService } from '../../../../../common/progress/progress.service';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StopNodeActionComponent', () => {
  let component: StopNodeActionComponent;
  let fixture: ComponentFixture<StopNodeActionComponent>;
  let mockNodeService: { stop: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockProgressService: { activate: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };
  let mockChangeDetectorRef: { markForCheck: ReturnType<typeof vi.fn> };

  const mockController: Controller = {
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

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console: 3000,
      console_auto_start: false,
      console_host: '0.0.0.0',
      console_type: 'telnet',
      first_port_name: 'eth0',
      height: 50,
      label: { x: 0, y: 0, rotation: 0, text: 'Test Node' },
      locked: false,
      node_directory: '/tmp/node',
      node_type: 'vpcs',
      port_name_format: 'eth{0}',
      port_segment_size: 1,
      ports: [],
      project_id: 'proj-1',
      properties: {} as Node['properties'],
      symbol: ':/symbols/vpcs.svg',
      symbol_url: '',
      width: 50,
      x: 100,
      y: 100,
      z: 0,
      command_line: '',
      compute_id: 'local',
      ...overrides,
    } as Node);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = { stop: vi.fn().mockReturnValue(of({})) };
    mockToasterService = { error: vi.fn() };
    mockProgressService = { activate: vi.fn(), deactivate: vi.fn() };
    mockChangeDetectorRef = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatMenuModule, StopNodeActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StopNodeActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not show stop button when nodes input is undefined', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });
  });

  describe('isNodeWithStartedStatus flag', () => {
    it('should set isNodeWithStartedStatus to true when any node has started status', () => {
      const nodes = [createMockNode({ status: 'started' }), createMockNode({ status: 'stopped' })];
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      expect(component.isNodeWithStartedStatus).toBe(true);
    });

    it('should set isNodeWithStartedStatus to false when no node has started status', () => {
      const nodes = [createMockNode({ status: 'stopped' }), createMockNode({ status: 'suspended' })];
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      expect(component.isNodeWithStartedStatus).toBe(false);
    });

    it('should set isNodeWithStartedStatus to false when all nodes are stopped', () => {
      const nodes = [createMockNode({ status: 'stopped' }), createMockNode({ status: 'stopped' })];
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      expect(component.isNodeWithStartedStatus).toBe(false);
    });

    it('should set isNodeWithStartedStatus to false for empty array', () => {
      const nodes: Node[] = [];
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      expect(component.isNodeWithStartedStatus).toBe(false);
    });
  });

  describe('stop button visibility', () => {
    it('should show stop button when isNodeWithStartedStatus is true', () => {
      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      component.isNodeWithStartedStatus = true;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Stop');
    });

    it('should hide stop button when isNodeWithStartedStatus is false', () => {
      const nodes = [createMockNode({ status: 'stopped' })];
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      component.isNodeWithStartedStatus = false;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });
  });

  describe('stopNodes()', () => {
    it('should call nodeService.stop() for each node regardless of status', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1', status: 'started' }),
        createMockNode({ node_id: 'node-2', status: 'started' }),
      ];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);

      component.stopNodes();

      expect(mockNodeService.stop).toHaveBeenCalledTimes(2);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should call nodeService.stop() for all nodes even if they are not started', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1', status: 'stopped' }),
        createMockNode({ node_id: 'node-2', status: 'suspended' }),
      ];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);

      component.stopNodes();

      expect(mockNodeService.stop).toHaveBeenCalledTimes(2);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should call nodeService.stop() for all nodes with mixed statuses', () => {
      const nodes = [
        createMockNode({ node_id: 'node-1', status: 'started' }),
        createMockNode({ node_id: 'node-2', status: 'stopped' }),
        createMockNode({ node_id: 'node-3', status: 'suspended' }),
      ];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);

      component.stopNodes();

      expect(mockNodeService.stop).toHaveBeenCalledTimes(3);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[1]);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[2]);
    });
  });

  describe('template integration', () => {
    it('should show stop button after setting nodes with started status', () => {
      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Stop');
    });

    it('should hide stop button after setting nodes with no started status', () => {
      const nodes = [createMockNode({ status: 'stopped' })];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });

    it('should trigger stopNodes() when stop button is clicked', () => {
      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockNodeService.stop).toHaveBeenCalledTimes(1);
      expect(mockNodeService.stop).toHaveBeenCalledWith(mockController, nodes[0]);
    });
  });

  describe('error handling', () => {
    it('should display toaster error when nodeService.stop() fails with error message', async () => {
      const mockError = {
        error: { message: 'Node busy' },
      };
      mockNodeService.stop.mockReturnValue(throwError(() => mockError));

      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Node busy');
    });

    it('should display generic error message when nodeService.stop() fails without specific message', async () => {
      mockNodeService.stop.mockReturnValue(throwError(() => new Error()));

      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to stop node');
    });

    it('should call markForCheck after error in nodeService.stop()', async () => {
      mockNodeService.stop.mockReturnValue(throwError(() => new Error('Test error')));

      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('nodes', nodes);
      component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
      fixture.detectChanges();

      // Spy on the component's ChangeDetectorRef
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
