import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReloadNodeActionComponent } from './reload-node-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

describe('ReloadNodeActionComponent', () => {
  let component: ReloadNodeActionComponent;
  let fixture: ComponentFixture<ReloadNodeActionComponent>;
  let mockNodeService: { reload: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
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

  const createMockNode = (nodeType: string): Node => ({
    node_id: `node-${nodeType}`,
    name: `Node ${nodeType}`,
    status: 'running',
    console_host: '0.0.0.0',
    node_type: nodeType,
    project_id: 'proj1',
    command_line: '',
    compute_id: 'compute1',
    height: 50,
    width: 50,
    x: 0,
    y: 0,
    z: 0,
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

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = { reload: vi.fn().mockReturnValue(of({})) };
    mockToasterService = { error: vi.fn() };
    mockCdr = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ReloadNodeActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReloadNodeActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('filteredNodes', () => {
    it('should contain vpcs nodes', () => {
      const nodes = [createMockNode('vpcs'), createMockNode('ethernet_switch')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toHaveLength(1);
      expect(component.filteredNodes[0].node_type).toBe('vpcs');
    });

    it('should contain qemu nodes', () => {
      const nodes = [createMockNode('qemu'), createMockNode('docker')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toHaveLength(1);
      expect(component.filteredNodes[0].node_type).toBe('qemu');
    });

    it('should contain virtualbox nodes', () => {
      const nodes = [createMockNode('virtualbox'), createMockNode('dynamips')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toHaveLength(1);
      expect(component.filteredNodes[0].node_type).toBe('virtualbox');
    });

    it('should contain vmware nodes', () => {
      const nodes = [createMockNode('vmware'), createMockNode('iou')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toHaveLength(1);
      expect(component.filteredNodes[0].node_type).toBe('vmware');
    });

    it('should contain multiple supported node types', () => {
      const nodes = [
        createMockNode('vpcs'),
        createMockNode('qemu'),
        createMockNode('virtualbox'),
        createMockNode('vmware'),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toHaveLength(4);
    });

    it('should exclude unsupported node types', () => {
      const nodes = [
        createMockNode('ethernet_switch'),
        createMockNode('docker'),
        createMockNode('dynamips'),
        createMockNode('iou'),
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toHaveLength(0);
    });
  });

  describe('Reload button visibility', () => {
    it('should show Reload button when filteredNodes has items', () => {
      const nodes = [createMockNode('vpcs')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Reload');
    });

    it('should hide Reload button when filteredNodes is empty', () => {
      const nodes = [createMockNode('ethernet_switch')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeFalsy();
    });
  });

  describe('reloadNodes', () => {
    it('should call nodeService.reload for each filtered node', () => {
      const nodes = [createMockNode('vpcs'), createMockNode('qemu')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.reloadNodes();

      expect(mockNodeService.reload).toHaveBeenCalledTimes(2);
      expect(mockNodeService.reload).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.reload).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should not call nodeService.reload when filteredNodes is empty', () => {
      const nodes = [createMockNode('ethernet_switch')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.reloadNodes();

      expect(mockNodeService.reload).not.toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have reloadNodes method', () => {
      expect(typeof component.reloadNodes).toBe('function');
    });

    it('should initialize filteredNodes as empty array', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.filteredNodes).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle node service error and show toaster', async () => {
      const errorResponse = { error: { message: 'Network error' } };
      mockNodeService.reload.mockReturnValue(throwError(() => errorResponse));
      const nodes = [createMockNode('vpcs')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.reloadNodes();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
    });

    it('should use default error message when error has no message', async () => {
      mockNodeService.reload.mockReturnValue(throwError(() => new Error()));
      const nodes = [createMockNode('vpcs')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.reloadNodes();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to reload node');
    });

    it('should call markForCheck after error', async () => {
      mockNodeService.reload.mockReturnValue(throwError(() => new Error('Test error')));
      const nodes = [createMockNode('vpcs')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.reloadNodes();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should handle empty nodes array', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.reloadNodes()).not.toThrow();
      expect(mockNodeService.reload).not.toHaveBeenCalled();
    });

    it('should handle undefined nodes input', () => {
      fixture.componentRef.setInput('nodes', undefined);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.reloadNodes()).not.toThrow();
      expect(mockNodeService.reload).not.toHaveBeenCalled();
    });
  });
});
