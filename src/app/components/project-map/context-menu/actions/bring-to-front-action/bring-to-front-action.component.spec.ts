import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { BringToFrontActionComponent } from './bring-to-front-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { ToasterService } from '@services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BringToFrontActionComponent', () => {
  let component: BringToFrontActionComponent;
  let fixture: ComponentFixture<BringToFrontActionComponent>;
  let mockNodeService: { update: ReturnType<typeof vi.fn> };
  let mockDrawingService: { update: ReturnType<typeof vi.fn> };
  let mockNodesDataSource: { update: ReturnType<typeof vi.fn> };
  let mockDrawingsDataSource: { update: ReturnType<typeof vi.fn> };
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
    mockNodeService = { update: vi.fn().mockReturnValue(of({})) };
    mockDrawingService = { update: vi.fn().mockReturnValue(of({})) };
    mockNodesDataSource = { update: vi.fn() };
    mockDrawingsDataSource = { update: vi.fn() };
    mockToasterService = { error: vi.fn() };
    mockCdr = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BringToFrontActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('bringToFront', () => {
    it('should set all nodes z value to max z among nodes and drawings', () => {
      const nodes = [createMockNode(0), createMockNode(1)];
      const drawings = [createMockDrawing(5)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      // max z is 5 (from drawings), but since 5 < 100, it increments to 6
      expect(nodes[0].z).toBe(6);
      expect(nodes[1].z).toBe(6);
    });

    it('should set all drawings z value to max z among nodes and drawings', () => {
      const nodes = [createMockNode(10)];
      const drawings = [createMockDrawing(2), createMockDrawing(3)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      // max z is 10 (from nodes), but since 10 < 100, it increments to 11
      expect(drawings[0].z).toBe(11);
      expect(drawings[1].z).toBe(11);
    });

    it('should increment max z by 1 when max z is less than 100', () => {
      const nodes = [createMockNode(5)];
      const drawings = [createMockDrawing(3)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      expect(nodes[0].z).toBe(6);
    });

    it('should not increment max z when max z is already 100 or greater', () => {
      const nodes = [createMockNode(100)];
      const drawings: Drawing[] = [];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      expect(nodes[0].z).toBe(100);
    });

    it('should call nodesDataSource.update for each node', () => {
      const nodes = [createMockNode(0), createMockNode(1)];
      const drawings: Drawing[] = [];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      expect(mockNodesDataSource.update).toHaveBeenCalledTimes(2);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(nodes[0]);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(nodes[1]);
    });

    it('should call nodeService.update for each node', () => {
      const nodes = [createMockNode(0), createMockNode(1)];
      const drawings: Drawing[] = [];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      expect(mockNodeService.update).toHaveBeenCalledTimes(2);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, nodes[0]);
      expect(mockNodeService.update).toHaveBeenCalledWith(mockController, nodes[1]);
    });

    it('should call drawingsDataSource.update for each drawing', () => {
      const nodes: Node[] = [];
      const drawings = [createMockDrawing(0), createMockDrawing(1)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      expect(mockDrawingsDataSource.update).toHaveBeenCalledTimes(2);
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawings[0]);
      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawings[1]);
    });

    it('should call drawingService.update for each drawing', () => {
      const nodes: Node[] = [];
      const drawings = [createMockDrawing(0), createMockDrawing(1)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();

      expect(mockDrawingService.update).toHaveBeenCalledTimes(2);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, drawings[0]);
      expect(mockDrawingService.update).toHaveBeenCalledWith(mockController, drawings[1]);
    });

    it('should handle empty nodes and drawings arrays', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      expect(() => component.bringToFront()).not.toThrow();
    });
  });

  describe('button click', () => {
    it('should call bringToFront when button is clicked', () => {
      const nodes = [createMockNode(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      const bringToFrontSpy = vi.spyOn(component, 'bringToFront');

      button.click();

      expect(bringToFrontSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should show error toast when nodeService.update fails', async () => {
      mockNodeService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to update node' } }))
      );
      const nodes = [createMockNode(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node');
    });

    it('should use fallback message when nodeService.update error has no message', async () => {
      mockNodeService.update.mockReturnValue(throwError(() => ({})));
      const nodes = [createMockNode(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to bring node to front');
    });

    it('should call markForCheck when nodeService.update fails', async () => {
      mockNodeService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );
      const nodes = [createMockNode(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.bringToFront();
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should show error toast when drawingService.update fails', async () => {
      mockDrawingService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to update drawing' } }))
      );
      const nodes: Node[] = [];
      const drawings = [createMockDrawing(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update drawing');
    });

    it('should use fallback message when drawingService.update error has no message', async () => {
      mockDrawingService.update.mockReturnValue(throwError(() => ({})));
      const nodes: Node[] = [];
      const drawings = [createMockDrawing(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.bringToFront();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to bring drawing to front');
    });

    it('should call markForCheck when drawingService.update fails', async () => {
      mockDrawingService.update.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );
      const nodes: Node[] = [];
      const drawings = [createMockDrawing(0)];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('drawings', drawings);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.bringToFront();
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
