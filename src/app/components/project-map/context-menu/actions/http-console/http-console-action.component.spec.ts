import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HttpConsoleActionComponent } from './http-console-action.component';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ToasterService } from '@services/toaster.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('HttpConsoleActionComponent', () => {
  let fixture: ComponentFixture<HttpConsoleActionComponent>;
  let component: HttpConsoleActionComponent;
  let mockNodeConsoleService: { openConsoleForNode: ReturnType<typeof vi.fn> };
  let mockVncConsoleService: { openVncConsole: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockMapSettingsService: { logConsoleSubject: { next: ReturnType<typeof vi.fn> } };

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    authToken: 'test-token',
    status: 'running',
    tokenExpired: false,
  };

  const mockProject: Project = {
    project_id: 'proj-1',
    name: 'Test Project',
    filename: '',
    path: '',
    status: 'opened',
    auto_start: false,
    auto_close: false,
    auto_open: false,
    scene_height: 1000,
    scene_width: 1000,
    show_layers: false,
    snap_to_grid: false,
    show_grid: false,
    grid_size: 75,
    drawing_grid_size: 25,
    show_interface_labels: false,
    variables: [],
    readonly: false,
  };

  const createMockNode = (overrides: Partial<Node> = {}): Node => {
    const defaults: Node = {
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      console: 3080,
      console_type: 'telnet',
      console_auto_start: false,
      node_type: 'vpcs',
      project_id: 'proj-1',
      command_line: '',
      compute_id: 'local',
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
      node_directory: '',
    };
    return Object.assign({}, defaults, overrides);
  };

  beforeEach(async () => {
    mockNodeConsoleService = { openConsoleForNode: vi.fn() };
    mockVncConsoleService = { openVncConsole: vi.fn() };
    mockToasterService = { error: vi.fn() };
    mockMapSettingsService = { logConsoleSubject: { next: vi.fn() } };

    await TestBed.configureTestingModule({
      imports: [HttpConsoleActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(NodeConsoleService, { useValue: mockNodeConsoleService })
      .overrideProvider(VncConsoleService, { useValue: mockVncConsoleService })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .overrideProvider(MapSettingsService, { useValue: mockMapSettingsService })
      .compileComponents();

    fixture = TestBed.createComponent(HttpConsoleActionComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('button visibility', () => {
    it('should show button when nodes is provided', () => {
      fixture.componentRef.setInput('nodes', [createMockNode()]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Web console');
    });

    it('should show button when nodes is empty array', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should show button when nodes is undefined', () => {
      fixture.componentRef.setInput('nodes', undefined);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });
  });

  describe('openConsole', () => {
    describe('single node requirement', () => {
      it('should show error when multiple nodes are provided', () => {
        const node1 = createMockNode({ name: 'Node1', status: 'started', console_type: 'telnet' });
        const node2 = createMockNode({ name: 'Node2', status: 'started', console_type: 'telnet' });
        fixture.componentRef.setInput('nodes', [node1, node2]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Inline web console is only supported for a single node.'
        );
      });

      it('should show error when no nodes are provided', () => {
        fixture.componentRef.setInput('nodes', []);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Inline web console is only supported for a single node.'
        );
      });
    });

    describe('VNC console', () => {
      it('should emit openWebConsoleInline event for started node with vnc console type', () => {
        const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
        const node = createMockNode({ console_type: 'vnc', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith({
          node,
          controller: mockController,
          project: mockProject,
        });
      });

      it('should not emit event for stopped node with vnc console type', () => {
        const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
        const node = createMockNode({ console_type: 'vnc', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(emitSpy).not.toHaveBeenCalled();
        expect(mockToasterService.error).toHaveBeenCalledWith(
          "Please start the node 'Test Node' before opening the console."
        );
      });
    });

    describe('HTTP/HTTPS console', () => {
      it('should emit openWebConsoleInline event for started node with http console type', () => {
        const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
        const node = createMockNode({
          console_type: 'http',
          console_host: '192.168.1.1',
          console: 80,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith({
          node,
          controller: mockController,
          project: mockProject,
        });
      });

      it('should emit openWebConsoleInline event for started node with https console type', () => {
        const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
        const node = createMockNode({
          console_type: 'https',
          console_host: '192.168.1.1',
          console: 443,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith({
          node,
          controller: mockController,
          project: mockProject,
        });
      });
    });

    describe('Terminal console', () => {
      it('should open telnet console in widget for started node', () => {
        const node = createMockNode({ console_type: 'telnet', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockMapSettingsService.logConsoleSubject.next).toHaveBeenCalledWith(true);
      });

      it('should open ssh console in widget for started node', () => {
        const node = createMockNode({ console_type: 'ssh', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockMapSettingsService.logConsoleSubject.next).toHaveBeenCalledWith(true);
      });

      it('should not open telnet console for stopped node', () => {
        const node = createMockNode({ console_type: 'telnet', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockNodeConsoleService.openConsoleForNode).not.toHaveBeenCalled();
        expect(mockToasterService.error).toHaveBeenCalledWith(
          "Please start the node 'Test Node' before opening the console."
        );
      });
    });

    describe('unsupported console type', () => {
      it('should show error for unsupported console type on started node', () => {
        const node = createMockNode({ console_type: 'unknown', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          "Console type 'unknown' is not supported for inline web console."
        );
      });
    });

    describe('nodes with console_type none', () => {
      it('should show error for nodes with console_type none', () => {
        const node = createMockNode({ console_type: 'none', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          "Node 'Test Node' has no console configured."
        );
      });
    });

    describe('missing controller or project', () => {
      it('should not open console when controller is undefined', () => {
        const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
        const node = createMockNode({ console_type: 'vnc', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', undefined);
        fixture.componentRef.setInput('project', mockProject);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('should not open console when project is undefined', () => {
        const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
        const node = createMockNode({ console_type: 'vnc', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.componentRef.setInput('project', undefined);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        expect(emitSpy).not.toHaveBeenCalled();
      });
    });
  });
});
