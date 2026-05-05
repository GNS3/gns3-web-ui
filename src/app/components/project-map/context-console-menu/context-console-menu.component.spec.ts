import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ContextConsoleMenuComponent } from './context-console-menu.component';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ToasterService } from '@services/toaster.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { Node, Properties } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ContextConsoleMenuComponent', () => {
  let component: ContextConsoleMenuComponent;
  let fixture: ComponentFixture<ContextConsoleMenuComponent>;

  let mockMapSettingsService: any;
  let mockNodeConsoleService: any;
  let mockToasterService: any;
  let mockVncConsoleService: any;
  let mockRouter: any;
  let mockChangeDetectorRef: any;
  let mockViewContainerRef: any;
  let mockMenuTrigger: any;
  let logConsoleSubjectNext: ReturnType<typeof vi.fn>;

  const createMockProperties = (): Properties => ({
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
  });

  const createMockNode = (overrides: Partial<Node> = {}): Node => ({
    node_id: 'node-1',
    project_id: 'project-1',
    name: 'Test Node',
    status: 'started',
    console_type: 'telnet',
    console: 5000,
    console_host: 'localhost',
    command_line: '',
    console_auto_start: false,
    compute_id: 'local',
    first_port_name: '',
    height: 50,
    label: { rotation: 0, style: '', text: 'Test', x: 0, y: 0 },
    locked: false,
    node_directory: '',
    node_type: 'vpcs',
    port_name_format: '',
    port_segment_size: 0,
    ports: [],
    properties: createMockProperties(),
    symbol: '',
    symbol_url: '',
    width: 50,
    x: 100,
    y: 100,
    z: 0,
    ...overrides,
  });

  const mockController: Controller = {
    id: 1,
    authToken: 'token123',
    name: 'Local Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  };

  beforeEach(async () => {
    logConsoleSubjectNext = vi.fn();

    mockMapSettingsService = {
      getConsoleContextMenuAction: vi.fn().mockReturnValue(null),
      setConsoleContextMenuAction: vi.fn(),
      logConsoleSubject: { next: logConsoleSubjectNext },
    };

    mockNodeConsoleService = {
      openConsoleForNode: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockVncConsoleService = {
      openVncConsole: vi.fn(),
    };

    mockRouter = {
      url: '/project/project-1/topology/node/node-1',
    };

    mockChangeDetectorRef = {
      detectChanges: vi.fn(),
      markForCheck: vi.fn(),
    };

    mockViewContainerRef = {
      createComponent: vi.fn().mockReturnValue({
        setInput: vi.fn(),
        changeDetectorRef: { detectChanges: vi.fn() },
        instance: { openConsole: vi.fn() },
      }),
    };

    mockMenuTrigger = {
      openMenu: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContextConsoleMenuComponent, MatMenuModule, MatIconModule],
      providers: [
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: VncConsoleService, useValue: mockVncConsoleService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextConsoleMenuComponent);
    component = fixture.componentInstance;

    // Set up viewChild mocks using Object.defineProperty
    Object.defineProperty(component, 'contextConsoleMenu', {
      get: () => () => mockMenuTrigger,
      configurable: true,
    });
    Object.defineProperty(component, 'container', {
      get: () => () => mockViewContainerRef,
      configurable: true,
    });

    component.controller = mockController;
    component.ngOnInit();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.clear();
  });

  describe('setPosition', () => {
    it('should set top and left positions with sanitized values', () => {
      component.setPosition(100, 200);

      const topValue = component.topPosition() as any;
      const leftValue = component.leftPosition() as any;
      expect(topValue.changingThisBreaksApplicationSecurity).toBe('100px');
      expect(leftValue.changingThisBreaksApplicationSecurity).toBe('200px');
    });
  });

  describe('openMenu', () => {
    it('should open menu when no console action is set', () => {
      component.openMenu(createMockNode(), 100, 200);

      expect(mockMapSettingsService.getConsoleContextMenuAction).toHaveBeenCalled();
      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });

    it('should call openWebConsole when action is web console', () => {
      mockMapSettingsService.getConsoleContextMenuAction.mockReturnValue('web console');
      const node = createMockNode();
      const openWebConsoleSpy = vi.spyOn(component, 'openWebConsole' as any);

      component.openMenu(node, 0, 0);

      expect(openWebConsoleSpy).toHaveBeenCalled();
    });

    it('should call openWebConsoleInNewTab when action is web console in new tab', () => {
      mockMapSettingsService.getConsoleContextMenuAction.mockReturnValue('web console in new tab');
      const node = createMockNode();
      const openWebConsoleInNewTabSpy = vi.spyOn(component, 'openWebConsoleInNewTab' as any);

      component.openMenu(node, 0, 0);

      expect(openWebConsoleInNewTabSpy).toHaveBeenCalled();
    });

    it('should call openConsole when action is console', () => {
      mockMapSettingsService.getConsoleContextMenuAction.mockReturnValue('console');
      const node = createMockNode();
      const openConsoleSpy = vi.spyOn(component, 'openConsole' as any);

      component.openMenu(node, 0, 0);

      expect(openConsoleSpy).toHaveBeenCalled();
    });
  });

  describe('openConsole', () => {
    it('should set console context menu action', () => {
      component.openConsole();

      expect(mockMapSettingsService.setConsoleContextMenuAction).toHaveBeenCalledWith('console');
    });

    it('should create ConsoleDeviceActionBrowser component', () => {
      component.openConsole();

      expect(mockViewContainerRef.createComponent).toHaveBeenCalled();
    });

    it('should set controller and node inputs on created component', () => {
      component.openConsole();

      const createResult = mockViewContainerRef.createComponent.mock.calls[0][0];
      expect(createResult).toBeDefined();
    });
  });

  describe('openWebConsole', () => {
    it('should show error when node is not started', () => {
      const stoppedNode = createMockNode({ status: 'stopped' });
      (component as any).node = stoppedNode;

      component.openWebConsole();

      expect(mockToasterService.error).toHaveBeenCalledWith('To open console please start the node');
    });

    it('should open VNC console when node type is vnc and status is started', () => {
      const vncNode = createMockNode({ status: 'started', console_type: 'vnc' });
      (component as any).node = vncNode;

      component.openWebConsole();

      expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, vncNode);
    });

    it('should show error for SPICE console type', () => {
      const spiceNode = createMockNode({ status: 'started', console_type: 'spice' });
      (component as any).node = spiceNode;

      component.openWebConsole();

      expect(mockToasterService.error).toHaveBeenCalledWith('SPICE console is not yet supported.');
    });

    it('should open terminal console for telnet type when node is started', () => {
      const telnetNode = createMockNode({ status: 'started', console_type: 'telnet' });
      (component as any).node = telnetNode;

      component.openWebConsole();

      expect(mockNodeConsoleService.openConsoleForNode).toHaveBeenCalledWith(telnetNode);
      expect(logConsoleSubjectNext).toHaveBeenCalledWith(true);
    });

    it('should open terminal console for ssh type when node is started', () => {
      const sshNode = createMockNode({ status: 'started', console_type: 'ssh' });
      (component as any).node = sshNode;

      component.openWebConsole();

      expect(mockNodeConsoleService.openConsoleForNode).toHaveBeenCalledWith(sshNode);
      expect(logConsoleSubjectNext).toHaveBeenCalledWith(true);
    });
  });

  describe('openWebConsoleInNewTab', () => {
    it('should show error when node is not started', () => {
      const stoppedNode = createMockNode({ status: 'stopped' });
      (component as any).node = stoppedNode;

      component.openWebConsoleInNewTab();

      expect(mockToasterService.error).toHaveBeenCalledWith('To open console please start the node');
    });

    it('should open VNC console when node type is vnc and status is started', () => {
      const vncNode = createMockNode({ status: 'started', console_type: 'vnc' });
      (component as any).node = vncNode;

      component.openWebConsoleInNewTab();

      expect(mockVncConsoleService.openVncConsole).toHaveBeenCalledWith(mockController, vncNode);
    });

    it('should show error for SPICE console type', () => {
      const spiceNode = createMockNode({ status: 'started', console_type: 'spice' });
      (component as any).node = spiceNode;

      component.openWebConsoleInNewTab();

      expect(mockToasterService.error).toHaveBeenCalledWith('SPICE console is not yet supported.');
    });

    it('should open terminal URL in new tab for telnet type when node is started', () => {
      const telnetNode = createMockNode({ status: 'started', console_type: 'telnet' });
      (component as any).node = telnetNode;
      const windowOpenSpy = vi.spyOn(window, 'open');

      component.openWebConsoleInNewTab();

      expect(windowOpenSpy).toHaveBeenCalled();
      windowOpenSpy.mockRestore();
    });

    it('should open terminal URL in new tab for ssh type when node is started', () => {
      const sshNode = createMockNode({ status: 'started', console_type: 'ssh' });
      (component as any).node = sshNode;
      const windowOpenSpy = vi.spyOn(window, 'open');

      component.openWebConsoleInNewTab();

      expect(windowOpenSpy).toHaveBeenCalled();
      windowOpenSpy.mockRestore();
    });

    it('should show error for unsupported console types', () => {
      const unknownNode = createMockNode({ status: 'started', console_type: 'unknown' });
      (component as any).node = unknownNode;

      component.openWebConsoleInNewTab();

      expect(mockToasterService.error).toHaveBeenCalledWith('Console type not supported in new tab');
    });
  });
});
