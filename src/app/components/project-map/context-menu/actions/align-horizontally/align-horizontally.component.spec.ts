import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlignHorizontallyActionComponent } from './align-horizontally.component';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { NodeService } from '@services/node.service';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

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

describe('AlignHorizontallyActionComponent', () => {
  let fixture: ComponentFixture<AlignHorizontallyActionComponent>;
  let component: AlignHorizontallyActionComponent;
  let mockNodesDataSource: any;
  let mockNodeService: any;
  let mockCdr: any;

  beforeEach(async () => {
    mockNodesDataSource = {
      update: vi.fn(),
    };

    mockNodeService = {
      update: vi.fn().mockReturnValue(of({})),
    };

    mockCdr = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AlignHorizontallyActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlignHorizontallyActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have alignHorizontally method', () => {
      expect(typeof component.alignHorizontally).toBe('function');
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

  describe('alignHorizontally()', () => {
    it('should align all nodes to the average Y coordinate', () => {
      const node1 = createMockNode({ y: 100 });
      const node2 = createMockNode({ y: 200 });
      const node3 = createMockNode({ y: 300 });
      fixture.componentRef.setInput('nodes', [node1, node2, node3]);
      fixture.componentRef.setInput('controller', createMockController());

      component.alignHorizontally();

      // Average Y = (100 + 200 + 300) / 3 = 200
      expect(node1.y).toBe(200);
      expect(node2.y).toBe(200);
      expect(node3.y).toBe(200);
    });

    it('should not change Y when all nodes have same Y coordinate', () => {
      const node1 = createMockNode({ y: 150 });
      const node2 = createMockNode({ y: 150 });
      fixture.componentRef.setInput('nodes', [node1, node2]);
      fixture.componentRef.setInput('controller', createMockController());

      component.alignHorizontally();

      expect(node1.y).toBe(150);
      expect(node2.y).toBe(150);
    });

    it('should update nodesDataSource for each node', () => {
      const node1 = createMockNode({ y: 100 });
      const node2 = createMockNode({ y: 200 });
      fixture.componentRef.setInput('nodes', [node1, node2]);
      fixture.componentRef.setInput('controller', createMockController());

      component.alignHorizontally();

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(node1);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(node2);
      expect(mockNodesDataSource.update).toHaveBeenCalledTimes(2);
    });

    it('should call nodeService.update for each node', () => {
      const node1 = createMockNode({ y: 100 });
      const node2 = createMockNode({ y: 200 });
      const controller = createMockController();
      fixture.componentRef.setInput('nodes', [node1, node2]);
      fixture.componentRef.setInput('controller', controller);

      component.alignHorizontally();

      expect(mockNodeService.update).toHaveBeenCalledWith(controller, node1);
      expect(mockNodeService.update).toHaveBeenCalledWith(controller, node2);
      expect(mockNodeService.update).toHaveBeenCalledTimes(2);
    });

    it('should handle single node alignment', () => {
      const node = createMockNode({ y: 250 });
      fixture.componentRef.setInput('nodes', [node]);
      fixture.componentRef.setInput('controller', createMockController());

      component.alignHorizontally();

      // Average Y of single node = its own Y
      expect(node.y).toBe(250);
      expect(mockNodesDataSource.update).toHaveBeenCalledWith(node);
      expect(mockNodeService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle empty nodes array gracefully', () => {
      fixture.componentRef.setInput('nodes', []);
      fixture.componentRef.setInput('controller', createMockController());

      expect(() => component.alignHorizontally()).not.toThrow();
      expect(mockNodesDataSource.update).not.toHaveBeenCalled();
      expect(mockNodeService.update).not.toHaveBeenCalled();
    });
  });
});
