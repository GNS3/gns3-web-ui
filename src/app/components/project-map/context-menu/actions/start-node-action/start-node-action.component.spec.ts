import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { StartNodeActionComponent } from './start-node-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from '../../../../../common/progress/progress.service';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StartNodeActionComponent', () => {
  let component: StartNodeActionComponent;
  let fixture: ComponentFixture<StartNodeActionComponent>;
  let mockNodeService: { start: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockProgressService: { activate: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };

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

  const createMockNode = (status: string): Node => ({
    node_id: `node-${status}`,
    name: `Node ${status}`,
    status,
    console_host: '0.0.0.0',
    node_type: 'vpcs',
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

    mockNodeService = { start: vi.fn().mockReturnValue(of({})) };
    mockToasterService = { error: vi.fn() };
    mockProgressService = { activate: vi.fn(), deactivate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(NodeService, { useValue: mockNodeService })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .overrideProvider(ProgressService, { useValue: mockProgressService })
      .overrideProvider(ChangeDetectorRef, { useValue: { markForCheck: vi.fn() } })
      .compileComponents();

    fixture = TestBed.createComponent(StartNodeActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('isNodeWithStoppedStatus', () => {
    it('should be true when any node has stopped status', () => {
      const nodes = [createMockNode('stopped'), createMockNode('started')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStoppedStatus).toBe(true);
    });

    it('should be true when any node has suspended status', () => {
      const nodes = [createMockNode('suspended'), createMockNode('started')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStoppedStatus).toBe(true);
    });

    it('should be true when all nodes have stopped status', () => {
      const nodes = [createMockNode('stopped'), createMockNode('stopped')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStoppedStatus).toBe(true);
    });

    it('should be false when all nodes have started status', () => {
      const nodes = [createMockNode('started'), createMockNode('started')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStoppedStatus).toBe(false);
    });

    it('should be false when all nodes have running status', () => {
      const nodes = [createMockNode('running'), createMockNode('running')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(component.isNodeWithStoppedStatus).toBe(false);
    });
  });

  describe('start button visibility', () => {
    it('should show Start button when nodes have stopped status', () => {
      const nodes = [createMockNode('stopped')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Start');
    });

    it('should hide Start button when all nodes are started', () => {
      const nodes = [createMockNode('started')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeFalsy();
    });
  });

  describe('startNodes', () => {
    it('should call nodeService.start for each node', () => {
      const nodes = [createMockNode('stopped'), createMockNode('stopped')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.startNodes();

      expect(mockNodeService.start).toHaveBeenCalledTimes(2);
      expect(mockNodeService.start).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.start).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should show error toast when nodeService.start fails', async () => {
      mockNodeService.start.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to start node' } }))
      );
      const nodes = [createMockNode('stopped')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(fixture.componentInstance['cdr'], 'markForCheck');
      component.startNodes();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to start node');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback message when nodeService.start error has no message', async () => {
      mockNodeService.start.mockReturnValue(throwError(() => ({})));
      const nodes = [createMockNode('stopped')];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.startNodes();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to start node');
    });
  });
});
