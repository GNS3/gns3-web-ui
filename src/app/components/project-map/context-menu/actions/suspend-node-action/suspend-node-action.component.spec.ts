import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { SuspendNodeActionComponent } from './suspend-node-action.component';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SuspendNodeActionComponent', () => {
  let fixture: ComponentFixture<SuspendNodeActionComponent>;
  let component: SuspendNodeActionComponent;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockController: Controller;

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      project_id: 'proj-1',
      name: 'Test Node',
      status: 'started',
      ...overrides,
    } as Node);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = {
      suspend: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      error: vi.fn(),
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
      imports: [SuspendNodeActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuspendNodeActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
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
      const nodes = [createMockNode({ node_id: 'node-1' }), createMockNode({ node_id: 'node-2' })];
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

  describe('error handling', () => {
    it('should display toaster error when nodeService.suspend() fails with error message', async () => {
      const mockError = {
        error: { message: 'Node busy' },
      };
      mockNodeService.suspend.mockReturnValue(throwError(() => mockError));

      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Node busy');
    });

    it('should display generic error message when nodeService.suspend() fails without specific message', async () => {
      mockNodeService.suspend.mockReturnValue(throwError(() => new Error()));

      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to suspend node');
    });

    it('should call markForCheck after error in nodeService.suspend()', async () => {
      mockNodeService.suspend.mockReturnValue(throwError(() => new Error('Test error')));

      const nodes = [createMockNode({ status: 'started' })];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
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
