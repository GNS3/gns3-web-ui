import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ConsoleDeviceActionBrowserComponent } from './console-device-action-browser.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ProtocolHandlerService } from '@services/protocol-handler.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { Controller } from '@models/controller';
import { Node } from '../../../../../cartography/models/node';
import { of, throwError } from 'rxjs';

describe('ConsoleDeviceActionBrowserComponent', () => {
  let component: ConsoleDeviceActionBrowserComponent;
  let fixture: ComponentFixture<ConsoleDeviceActionBrowserComponent>;
  let mockNodeService: NodeService;
  let mockToasterService: ToasterService;
  let mockProtocolHandlerService: ProtocolHandlerService;
  let mockVncConsoleService: VncConsoleService;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    authToken: 'token',
    location: 'local',
    host: 'localhost',
    port: 8080,
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
    status: 'stopped',
  };

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      command_line: '',
      compute_id: 'local',
      console: 5000,
      console_auto_start: false,
      console_host: '0.0.0.0',
      console_type: 'telnet',
      custom_adapters: [],
      ethernet_adapters: [],
      serial_adapters: [],
      first_port_name: '',
      height: 50,
      label: { text: 'Test Node' } as any,
      locked: false,
      name: 'Test Node',
      node_directory: '',
      node_id: 'node-1',
      node_type: 'qemu',
      port_name_format: '',
      port_segment_size: 1,
      ports: [],
      project_id: 'project-1',
      properties: {
        aux: 5001,
        adapter_type: '',
        adapters: 1,
        ethernet_adapters: 0,
        serial_adapters: 0,
        headless: false,
        linked_clone: false,
        on_close: '',
        ram: 512,
        system_id: '',
        nvram: 1024,
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
        cpus: 1,
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
        memory: 512,
        tpm: false,
        uefi: false,
      } as any,
      status: 'started',
      symbol: '',
      symbol_url: '',
      tags: [],
      usage: '',
      width: 50,
      x: 0,
      y: 0,
      z: 0,
      ...overrides,
    } as Node);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(createMockNode())),
    } as any;

    mockToasterService = {
      error: vi.fn(),
    } as any;

    mockProtocolHandlerService = {
      open: vi.fn(),
    } as any;

    mockVncConsoleService = {
      openVncConsole: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ConsoleDeviceActionBrowserComponent, MatButtonModule, MatIconModule, MatMenuModule],
    })
      .overrideProvider(NodeService, { useValue: mockNodeService })
      .overrideProvider(ToasterService, { useValue: mockToasterService })
      .overrideProvider(ProtocolHandlerService, { useValue: mockProtocolHandlerService })
      .overrideProvider(VncConsoleService, { useValue: mockVncConsoleService })
      .compileComponents();

    fixture = TestBed.createComponent(ConsoleDeviceActionBrowserComponent);
    component = fixture.componentInstance;
  });

  describe('template rendering', () => {
    it('should render Console button', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', createMockNode());
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
      expect(buttons[0].textContent).toContain('Console');
    });

    it('should render Auxiliary console button for docker node', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', createMockNode({ node_type: 'docker' }));
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
      expect(buttons.length).toBe(2);
      expect(buttons[1].textContent).toContain('Auxiliary console');
    });

    it('should render Auxiliary console button for dynamips node', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', createMockNode({ node_type: 'dynamips' }));
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
      expect(buttons.length).toBe(2);
      expect(buttons[1].textContent).toContain('Auxiliary console');
    });

    it('should render Auxiliary console button for qemu node', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', createMockNode({ node_type: 'qemu' }));
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
      expect(buttons.length).toBe(2);
      expect(buttons[1].textContent).toContain('Auxiliary console');
    });

    it('should not render Auxiliary console button for other node types', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', createMockNode({ node_type: 'virtualbox' }));
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
      expect(buttons.length).toBe(1);
    });
  });

  describe('openConsole()', () => {
    it('should fetch node from NodeService when called', () => {
      const mockNode = createMockNode();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.openConsole();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should show error toast when node is not started', () => {
      const mockNode = createMockNode({ status: 'stopped' });
      (mockNodeService.getNode as any).mockReturnValue(of(mockNode));

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.openConsole();

      expect(mockToasterService.error).toHaveBeenCalledWith('This node must be started before a console can be opened');
    });

    it('should return early if node input is undefined', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', undefined);
      fixture.detectChanges();

      component.openConsole();

      expect(mockNodeService.getNode).not.toHaveBeenCalled();
    });

    it('should show error toast when nodeService.getNode fails', async () => {
      (mockNodeService.getNode as any).mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to fetch node' } }))
      );
      const mockNode = createMockNode();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.openConsole();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to fetch node');
    });

    it('should use fallback message when getNode error has no message', async () => {
      (mockNodeService.getNode as any).mockReturnValue(throwError(() => ({})));
      const mockNode = createMockNode();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.openConsole();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to get node information');
    });

    it('should call markForCheck when getNode fails', async () => {
      (mockNodeService.getNode as any).mockReturnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );
      const mockNode = createMockNode();
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.openConsole();
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('startConsole() with telnet', () => {
    it('should build correct telnet URI', () => {
      const mockNode = createMockNode({
        console_host: '192.168.1.1',
        console: 5000,
        console_type: 'telnet',
        name: 'Router1',
        project_id: 'proj-1',
        node_id: 'node-1',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        'gns3+telnet://192.168.1.1:5000?name=Router1&project_id=proj-1&node_id=node-1'
      );
    });

    it('should use auxiliary port when auxiliary is true', () => {
      const mockNode = createMockNode({
        console_host: '192.168.1.1',
        console: 5000,
        console_type: 'telnet',
        name: 'Router1',
        project_id: 'proj-1',
        node_id: 'node-1',
        properties: { aux: 5002 } as any,
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(true);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        'gns3+telnet://192.168.1.1:5002?name=Router1&project_id=proj-1&node_id=node-1'
      );
    });

    it('should show error when auxiliary port is undefined', () => {
      const mockNode = createMockNode({
        console_type: 'telnet',
        properties: { aux: undefined } as any,
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(true);

      expect(mockToasterService.error).toHaveBeenCalledWith('Auxiliary console port is not set.');
    });
  });

  describe('startConsole() with ssh', () => {
    it('should build correct ssh URI', () => {
      const mockNode = createMockNode({
        console_host: '192.168.1.1',
        console: 5000,
        console_type: 'ssh',
        name: 'Router1',
        project_id: 'proj-1',
        node_id: 'node-1',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        'gns3+ssh://192.168.1.1:5000?name=Router1&project_id=proj-1&node_id=node-1'
      );
    });
  });

  describe('startConsole() with IPv6', () => {
    it('should wrap IPv6 address in brackets for telnet', () => {
      const mockNode = createMockNode({
        console_host: '::1',
        console: 5000,
        console_type: 'telnet',
        name: 'Router1',
        project_id: 'proj-1',
        node_id: 'node-1',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        'gns3+telnet://[::1]:5000?name=Router1&project_id=proj-1&node_id=node-1'
      );
    });

    it('should handle 0.0.0.0 host by replacing with controller host', () => {
      const mockNode = createMockNode({
        console_host: '0.0.0.0',
        console: 5000,
        console_type: 'telnet',
        name: 'Router1',
        project_id: 'proj-1',
        node_id: 'node-1',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        `gns3+telnet://${mockController.host}:5000?name=Router1&project_id=proj-1&node_id=node-1`
      );
    });

    it('should handle :: host by replacing with controller host', () => {
      const mockNode = createMockNode({
        console_host: '::',
        console: 5000,
        console_type: 'telnet',
        name: 'Router1',
        project_id: 'proj-1',
        node_id: 'node-1',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        `gns3+telnet://${mockController.host}:5000?name=Router1&project_id=proj-1&node_id=node-1`
      );
    });
  });

  describe('startConsole() with vnc', () => {
    it('should call VncConsoleService for vnc console type', () => {
      const mockNode = createMockNode({
        console_type: 'vnc',
        console_host: '192.168.1.1',
        console: 5900,
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, mockNode);
      expect(mockProtocolHandlerService.open).not.toHaveBeenCalled();
    });
  });

  describe('startConsole() with spice', () => {
    it('should build correct spice URI', () => {
      const mockNode = createMockNode({
        console_host: '192.168.1.1',
        console: 5900,
        console_type: 'spice',
        name: 'VM1',
        project_id: 'proj-1',
        node_id: 'node-1',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).toHaveBeenCalledWith(
        'gns3+spice://192.168.1.1:5900?name=VM1&project_id=proj-1&node_id=node-1'
      );
    });
  });

  describe('startConsole() with http', () => {
    it('should open http console directly in new window', () => {
      const mockNode = createMockNode({
        console_host: '192.168.1.1',
        console: 8080,
        console_type: 'http',
        name: 'WebServer',
      });

      const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.1:8080');
      expect(mockProtocolHandlerService.open).not.toHaveBeenCalled();

      windowOpenSpy.mockRestore();
    });
  });

  describe('startConsole() with unsupported type', () => {
    it('should show error for unsupported console type', () => {
      const mockNode = createMockNode({
        console_type: 'unsupported',
      });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Supported console types are: telnet, ssh, vnc, spice and spice+agent.'
      );
    });

    it('should return early if node is undefined', () => {
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('node', undefined);
      fixture.detectChanges();

      component.startConsole(false);

      expect(mockProtocolHandlerService.open).not.toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });
});
