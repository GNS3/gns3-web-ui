import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpConsoleNewTabActionComponent } from './http-console-new-tab-action.component';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

const createMockController = (): Controller => ({
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
});

const createMockNode = (overrides: Partial<Node> = {}): Node => {
  const defaults: Node = {
    node_id: 'node-uuid-1',
    name: 'Router1',
    status: 'started',
    console_host: '0.0.0.0',
    node_type: 'dynamips',
    project_id: 'proj-1',
    command_line: 'telnet 127.0.0.1 5000',
    compute_id: 'local',
    height: 40,
    width: 40,
    x: 100,
    y: 200,
    z: 1,
    port_name_format: 'eth{0}',
    port_segment_size: 0,
    first_port_name: '',
    label: { rotation: 0, style: '', text: 'R1', x: 0, y: 0 },
    symbol: '',
    symbol_url: '',
    properties: {
      adapter_type: '',
      adapters: 0,
      ethernet_adapters: 0,
      serial_adapters: 0,
      headless: false,
      linked_clone: false,
      on_close: '',
      aux: 0,
      ram: 0,
      system_id: '',
      nvram: 0,
      image: '',
      usage: '',
      use_any_adapter: false,
      vmname: '',
      ports_mapping: [],
      mappings: {},
      bios_image: '',
      boot_priority: '',
      cdrom_image: '',
      cpu_throttling: 0,
      cpus: 0,
      hda_disk_image: '',
      hda_disk_image_md5sum: '',
      hda_disk_interface: '',
      hdb_disk_image: '',
      hdb_disk_interface: '',
      hdc_disk_image: '',
      hdc_disk_interface: '',
      hdd_disk_image: '',
      hdd_disk_interface: '',
      initrd: '',
      kernel_command_line: '',
      kernel_image: '',
      mac_address: '',
      mac_addr: '',
      options: '',
      platform: '',
      disk0: 0,
      disk1: 0,
      idlepc: '',
      idlemax: 0,
      idlesleep: 0,
      exec_area: 0,
      mmap: false,
      sparsemem: false,
      auto_delete_disks: false,
      process_priority: '',
      qemu_path: '',
      environment: '',
      extra_hosts: '',
      start_command: '',
      replicate_network_connection_state: false,
      memory: 0,
      tpm: false,
      uefi: false,
    },
    console: 5000,
    console_auto_start: false,
    console_type: 'telnet',
    locked: false,
    node_directory: '',
    ports: [],
  };
  return Object.assign({}, defaults, overrides);
};

describe('HttpConsoleNewTabActionComponent', () => {
  let fixture: ComponentFixture<HttpConsoleNewTabActionComponent>;
  let component: HttpConsoleNewTabActionComponent;
  let mockNodeConsoleService: any;
  let mockVncConsoleService: any;
  let mockToasterService: any;
  let mockWindowOpen: any;
  let mockController: Controller;

  beforeEach(async () => {
    mockNodeConsoleService = { openNodeConsole: vi.fn() };
    mockVncConsoleService = { openVncConsole: vi.fn() };
    mockToasterService = { error: vi.fn() };
    mockWindowOpen = vi.fn();
    mockController = createMockController();

    vi.stubGlobal('window', {
      open: mockWindowOpen,
      location: { href: 'http://localhost/project_id/controller_id/topology/project_uuid' },
    });

    await TestBed.configureTestingModule({
      imports: [HttpConsoleNewTabActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: VncConsoleService, useValue: mockVncConsoleService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: { url: 'http://localhost/project_id/controller_id/topology/project_uuid' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HttpConsoleNewTabActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have openConsole method', () => {
      expect(typeof component.openConsole).toBe('function');
    });
  });

  describe('Inputs', () => {
    it('should have nodes input with undefined initial value', () => {
      expect(component.nodes()).toBeUndefined();
    });

    it('should have controller input with undefined initial value', () => {
      expect(component.controller()).toBeUndefined();
    });
  });

  describe('openConsole()', () => {
    describe('VNC console', () => {
      it('should call vncConsoleService.openVncConsole when node has vnc console type', () => {
        const node = createMockNode({ console_type: 'vnc', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, node, true);
      });

      it('should not open window when node has vnc console type', () => {
        const node = createMockNode({ console_type: 'vnc', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).not.toHaveBeenCalled();
      });
    });

    describe('HTTP/HTTPS console', () => {
      it('should open window with http URL when node has http console type', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '192.168.1.50',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalledWith('http://192.168.1.50:8080', '_blank');
      });

      it('should open window with https URL when node has https console type', () => {
        const node = createMockNode({
          console_type: 'https',
          console_host: '192.168.1.50',
          console: 8443,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalledWith('https://192.168.1.50:8443', '_blank');
      });

      it('should replace 0.0.0.0 console_host with controller host', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '0.0.0.0',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalledWith('http://192.168.1.100:8080', '_blank');
      });

      it('should replace IPv6 loopback addresses with controller host', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '::',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalledWith('http://192.168.1.100:8080', '_blank');
      });

      it('should replace IPv6 full loopback with controller host', () => {
        const node = createMockNode({
          console_type: 'http',
          console_host: '0:0:0:0:0:0:0:0',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalledWith('http://192.168.1.100:8080', '_blank');
      });
    });

    describe('Terminal console', () => {
      it('should open window with telnet URL when node has telnet console type', () => {
        const node = createMockNode({ console_type: 'telnet', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalled();
        const calledUrl = mockWindowOpen.mock.calls[0][0];
        expect(calledUrl).toContain('/nodes/' + node.node_id);
        expect(calledUrl).toContain('/static/web-ui/');
      });

      it('should open window with terminal URL when node has ssh console type', () => {
        const node = createMockNode({ console_type: 'ssh', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalled();
        const calledUrl = mockWindowOpen.mock.calls[0][0];
        expect(calledUrl).toContain('/nodes/' + node.node_id);
        expect(calledUrl).toContain('/static/web-ui/');
      });
    });

    describe('Unsupported console type', () => {
      it('should show error when console type is not supported', () => {
        const node = createMockNode({ console_type: 'unknown', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          "Console type 'unknown' not supported in new tab for node Router1."
        );
      });

      it('should not open window when console type is unsupported', () => {
        const node = createMockNode({ console_type: 'unknown', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).not.toHaveBeenCalled();
      });
    });

    describe('Node not started', () => {
      it('should show error listing not started nodes', () => {
        const node = createMockNode({ console_type: 'http', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Please start the following nodes if you want to open consoles in new tabs: Router1 '
        );
      });

      it('should not open window when node is not started', () => {
        const node = createMockNode({ console_type: 'http', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).not.toHaveBeenCalled();
      });

      it('should show error with all not started node names', () => {
        const node1 = createMockNode({ name: 'Router1', console_type: 'http', status: 'stopped' });
        const node2 = createMockNode({ name: 'Switch1', console_type: 'http', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [node1, node2]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Please start the following nodes if you want to open consoles in new tabs: Router1 Switch1 '
        );
      });
    });

    describe('Console type none', () => {
      it('should not open window for node with console_type none', () => {
        const node = createMockNode({ console_type: 'none', status: 'started' });
        fixture.componentRef.setInput('nodes', [node]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).not.toHaveBeenCalled();
        expect(mockVncConsoleService.openVncConsole).not.toHaveBeenCalled();
        expect(mockToasterService.error).not.toHaveBeenCalled();
      });
    });

    describe('Mixed nodes scenarios', () => {
      it('should process multiple nodes with different console types', () => {
        const vncNode = createMockNode({ name: 'VNCNode', console_type: 'vnc', status: 'started' });
        const httpNode = createMockNode({
          name: 'HTTPNode',
          console_type: 'http',
          console_host: '192.168.1.50',
          console: 8080,
          status: 'started',
        });
        fixture.componentRef.setInput('nodes', [vncNode, httpNode]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, vncNode, true);
        expect(mockWindowOpen).toHaveBeenCalledWith('http://192.168.1.50:8080', '_blank');
      });

      it('should handle mixed started and not started nodes', () => {
        const startedNode = createMockNode({
          name: 'StartedNode',
          console_type: 'http',
          console_host: '192.168.1.50',
          console: 8080,
          status: 'started',
        });
        const stoppedNode = createMockNode({ name: 'StoppedNode', console_type: 'http', status: 'stopped' });
        fixture.componentRef.setInput('nodes', [startedNode, stoppedNode]);
        fixture.componentRef.setInput('controller', mockController);
        fixture.detectChanges();

        component.openConsole();

        expect(mockWindowOpen).toHaveBeenCalledWith('http://192.168.1.50:8080', '_blank');
        expect(mockToasterService.error).toHaveBeenCalledWith(
          'Please start the following nodes if you want to open consoles in new tabs: StoppedNode '
        );
      });
    });
  });

  describe('Button', () => {
    it('should render button with http icon and correct text', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Web console in new tab');
    });

    it('should call openConsole when button is clicked', () => {
      const node = createMockNode({
        console_type: 'http',
        console_host: '192.168.1.50',
        console: 8080,
        status: 'started',
      });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();
      const openConsoleSpy = vi.spyOn(component, 'openConsole');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(openConsoleSpy).toHaveBeenCalled();
    });
  });
});
