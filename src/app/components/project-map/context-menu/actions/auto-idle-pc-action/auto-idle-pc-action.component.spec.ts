import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AutoIdlePcActionComponent } from './auto-idle-pc-action.component';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from '../../../../../common/progress/progress.service';

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
    properties: createMockProperties(),
    console: 5000,
    console_auto_start: false,
    console_type: 'telnet',
    locked: false,
    node_directory: '',
    ports: [],
  };
  return Object.assign({}, defaults, overrides);
};

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

describe('AutoIdlePcActionComponent', () => {
  let fixture: ComponentFixture<AutoIdlePcActionComponent>;
  let component: AutoIdlePcActionComponent;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockProgressService: any;

  beforeEach(async () => {
    mockNodeService = {
      getAutoIdlePC: vi.fn(),
    };
    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AutoIdlePcActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProgressService, useValue: mockProgressService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AutoIdlePcActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have autoIdlePC method', () => {
      expect(typeof component.autoIdlePC).toBe('function');
    });
  });

  describe('Inputs', () => {
    it('should have node input with undefined initial value', () => {
      expect(component.node()).toBeUndefined();
    });

    it('should have controller input with undefined initial value', () => {
      expect(component.controller()).toBeUndefined();
    });

    it('should not render button when node is undefined', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('button');
      expect(button).toBeFalsy();
    });

    it('should not render button when node type is not dynamips', () => {
      const mockNode = createMockNode({ node_type: 'qemu' });
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('button');
      expect(button).toBeFalsy();
    });
  });

  describe('Rendering with valid node', () => {
    it('should render button with query_builder icon and Auto Idle-PC text when node is dynamips', () => {
      const mockNode = createMockNode({ node_type: 'dynamips' });
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Auto Idle-PC');
    });
  });

  describe('autoIdlePC()', () => {
    it('should activate progress service when called', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(of({ idlepc: '0x1234' }));

      component.autoIdlePC();

      expect(mockProgressService.activate).toHaveBeenCalled();
    });

    it('should call nodeService.getAutoIdlePC with controller and node', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(of({ idlepc: '0x1234' }));

      component.autoIdlePC();

      expect(mockNodeService.getAutoIdlePC).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should show success toast when idlepc is not null', () => {
      const mockNode = createMockNode({ name: 'Router1' });
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(of({ idlepc: '0x1234' }));

      component.autoIdlePC();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Router1 updated with idle-PC value 0x1234');
    });

    it('should not show toast when idlepc is null', () => {
      const mockNode = createMockNode({ name: 'Router1' });
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(of({ idlepc: null }));

      component.autoIdlePC();

      expect(mockToasterService.success).not.toHaveBeenCalled();
    });

    it('should deactivate progress service on success', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(of({ idlepc: '0x1234' }));

      component.autoIdlePC();

      expect(mockProgressService.deactivate).toHaveBeenCalled();
    });

    it('should show error toast when API call fails', () => {
      const mockNode = createMockNode({ name: 'Router1' });
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(throwError(() => new Error('API error')));

      component.autoIdlePC();

      expect(mockToasterService.error).toHaveBeenCalledWith('Error while updating idle-PC value for node Router1');
    });

    it('should deactivate progress service on error', () => {
      const mockNode = createMockNode();
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      mockNodeService.getAutoIdlePC.mockReturnValue(throwError(() => new Error('API error')));

      component.autoIdlePC();

      expect(mockProgressService.deactivate).toHaveBeenCalled();
    });
  });

  describe('Button click', () => {
    it('should trigger autoIdlePC when button is clicked', () => {
      const mockNode = createMockNode({ node_type: 'dynamips' });
      fixture.componentRef.setInput('node', mockNode);
      fixture.detectChanges();
      const autoIdlePCSpy = vi.spyOn(component, 'autoIdlePC');
      mockNodeService.getAutoIdlePC.mockReturnValue(of({ idlepc: '0x1234' }));

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(autoIdlePCSpy).toHaveBeenCalled();
    });
  });
});
