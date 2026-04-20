import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ConsoleDeviceActionComponent } from './console-device-action.component';
import { ToasterService } from '@services/toaster.service';
import { NodeService } from '@services/node.service';
import { ControllerService } from '@services/controller.service';
import { SettingsService } from '@services/settings.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ConsoleDeviceActionComponent', () => {
  let fixture: ComponentFixture<ConsoleDeviceActionComponent>;
  let mockToasterService: { error: ReturnType<typeof vi.fn> };

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
    mockToasterService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConsoleDeviceActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .overrideProvider(NodeService, { useValue: vi.fn() })
      .overrideProvider(ControllerService, { useValue: vi.fn() })
      .overrideProvider(SettingsService, { useValue: vi.fn() })
      .compileComponents();

    fixture = TestBed.createComponent(ConsoleDeviceActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  describe('button visibility', () => {
    it('should show Console button when nodes is provided', () => {
      fixture.componentRef.setInput('nodes', [createMockNode()]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Console');
    });

    it('should show Console button when nodes is empty array', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Console');
    });

    it('should show Console button when nodes is undefined', () => {
      fixture.componentRef.setInput('nodes', undefined);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Console');
    });
  });

  describe('console()', () => {
    it('should show error toast when called', () => {
      fixture.componentRef.setInput('nodes', [createMockNode()]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Console action is only supported in Electron mode');
    });

    it('should show error toast with correct message regardless of node status', () => {
      const stoppedNode = createMockNode({ status: 'stopped' });
      fixture.componentRef.setInput('nodes', [stoppedNode]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Console action is only supported in Electron mode');
    });

    it('should show error toast with correct message regardless of console type', () => {
      const vncNode = createMockNode({ console_type: 'vnc' });
      fixture.componentRef.setInput('nodes', [vncNode]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Console action is only supported in Electron mode');
    });

    it('should show error toast when called with multiple nodes', () => {
      const node1 = createMockNode({ name: 'Node1' });
      const node2 = createMockNode({ name: 'Node2' });
      fixture.componentRef.setInput('nodes', [node1, node2]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Console action is only supported in Electron mode');
    });
  });
});
