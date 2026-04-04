import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextMenuComponent } from './context-menu.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Label } from '../../../cartography/models/label';
import { Node } from '../../../cartography/models/node';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';

describe('ContextMenuComponent', () => {
  let component: ContextMenuComponent;
  let fixture: ComponentFixture<ContextMenuComponent>;
  let mockMenuTrigger: MatMenuTrigger;
  let mockSanitizer: DomSanitizer;
  let mockDetectChanges: ReturnType<typeof vi.fn>;

  const mockProject: Project = {
    auto_close: false,
    auto_open: false,
    auto_start: false,
    drawing_grid_size: 25,
    filename: 'test.gns3',
    grid_size: 25,
    name: 'Test Project',
    path: '/path/to/project',
    project_id: 'project-123',
    scene_height: 1000,
    scene_width: 1000,
    status: 'opened',
    readonly: false,
    show_interface_labels: true,
    show_layers: true,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
  };

  const mockController: Controller = {
    authToken: 'token',
    id: 1,
    name: 'Local Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
  };

  const mockBundledController: Controller = {
    ...mockController,
    location: 'bundled',
  };

  const createMockNode = (overrides: Partial<Node> = {}): Node => ({
    command_line: '',
    compute_id: 'local',
    console: 3080,
    console_auto_start: false,
    console_host: '127.0.0.1',
    console_type: 'vnc',
    first_port_name: 'eth0',
    height: 50,
    label: { rotation: 0, style: '', text: 'Node', x: 0, y: 0 },
    locked: false,
    name: 'Test Node',
    node_directory: '/tmp/node',
    node_id: 'node-123',
    node_type: 'vpcs',
    port_name_format: 'eth{0}',
    port_segment_size: 4,
    ports: [],
    project_id: 'project-123',
    properties: {
      adapter_type: 'virtio',
      adapters: 1,
      ethernet_adapters: 0,
      serial_adapters: 0,
      headless: false,
      linked_clone: false,
      on_close: '',
      aux: 0,
      ram: 256,
      system_id: '',
      nvram: 128,
      image: 'vpcs.bin',
      usage: '',
      use_any_adapter: false,
      vmname: 'Test VM',
      ports_mapping: [],
      mappings: {},
      bios_image: '',
      boot_priority: 'c',
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
      memory: 256,
      tpm: false,
      uefi: false,
    },
    status: 'stopped',
    symbol: 'router',
    symbol_url: '/symbols/router.svg',
    width: 50,
    x: 100,
    y: 100,
    z: 0,
    ...overrides,
  });

  const createMockDrawing = (overrides: Partial<Drawing> = {}): Drawing => ({
    drawing_id: 'drawing-123',
    project_id: 'project-123',
    rotation: 0,
    svg: '<svg></svg>',
    locked: false,
    x: 100,
    y: 100,
    z: 0,
    element: null as any,
    ...overrides,
  });

  const createTextElementDrawing = (): Drawing => {
    const textElement = new TextElement();
    textElement.height = 20;
    textElement.width = 100;
    textElement.text = 'Hello';
    textElement.fill = '#000000';
    textElement.fill_opacity = 1;
    textElement.font_family = 'Arial';
    textElement.font_size = 14;
    textElement.font_weight = 'normal';
    textElement.text_decoration = 'none';
    return createMockDrawing({ element: textElement });
  };

  const createMockLabel = (overrides: Partial<Label> = {}): Label => ({
    rotation: 0,
    style: '',
    text: 'Label',
    x: 100,
    y: 100,
    ...overrides,
  });

  const createMockLink = (overrides: Partial<Link> = {}): Link => ({
    capture_file_name: '',
    capture_file_path: '',
    capturing: false,
    link_id: 'link-123',
    link_type: 'ethernet',
    nodes: [],
    project_id: 'project-123',
    suspend: false,
    distance: 0,
    length: 0,
    source: createMockNode(),
    target: createMockNode({ node_id: 'node-456' }),
    x: 0,
    y: 0,
    ...overrides,
  });

  const createMockLinkNode = (overrides: Partial<LinkNode> = {}): LinkNode => ({
    node_id: 'node-123',
    adapter_number: 0,
    port_number: 0,
    label: createMockLabel(),
    ...overrides,
  });

  beforeEach(async () => {
    mockDetectChanges = vi.fn();

    mockMenuTrigger = {
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
    } as any as MatMenuTrigger;

    mockSanitizer = {
      bypassSecurityTrustStyle: vi.fn((value: string) => value as any),
    } as any as DomSanitizer;

    const mockProjectService = {
      isReadOnly: vi.fn((project: Project) => project.readonly),
    };

    await TestBed.configureTestingModule({
      imports: [ContextMenuComponent, MatMenuModule],
      providers: [
        { provide: DomSanitizer, useValue: mockSanitizer },
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    component.project = mockProject;
    component.controller = mockController;
    component.contextMenu = mockMenuTrigger;
    // Inject mock change detector
    (component as any).changeDetector = { detectChanges: mockDetectChanges };
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have project as input', () => {
      expect(component.project).toBeDefined();
      expect(component.project.name).toBe('Test Project');
    });

    it('should have controller as input', () => {
      expect(component.controller).toBeDefined();
      expect(component.controller.name).toBe('Local Controller');
    });

    it('should have contextMenu ViewChild', () => {
      expect(component.contextMenu).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should set initial position to 0,0', () => {
      fixture.detectChanges();
      expect(component.topPosition).toBe('0px');
      expect(component.leftPosition).toBe('0px');
    });

    it('should set isBundledController to false for local controller', () => {
      fixture.detectChanges();
      expect(component.isBundledController).toBe(false);
    });

    it('should set isBundledController to true for bundled controller', () => {
      component.controller = mockBundledController;
      fixture.detectChanges();
      expect(component.isBundledController).toBe(true);
    });
  });

  describe('setPosition', () => {
    it('should set top and left position with px suffix', () => {
      component.setPosition(100, 200);
      expect(component.topPosition).toBe('100px');
      expect(component.leftPosition).toBe('200px');
    });

    it('should sanitize position values', () => {
      component.setPosition(50, 75);
      expect(mockSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith('50px');
      expect(mockSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith('75px');
    });

    it('should trigger change detection', () => {
      component.setPosition(0, 0);
      expect(mockDetectChanges).toHaveBeenCalled();
    });
  });

  describe('resetCapabilities', () => {
    it('should clear all collections when opening a new menu', () => {
      component.drawings = [createMockDrawing()];
      component.nodes = [createMockNode()];
      component.labels = [createMockLabel()];
      component.linkNodes = [createMockLinkNode()];
      component.links = [createMockLink()];
      component.hasTextCapabilities = true;

      // Opening a new menu should reset all capabilities
      component.openMenuForDrawing(createMockDrawing(), 0, 0);
      expect(component.drawings.length).toBe(1);
      expect(component.nodes.length).toBe(0);
      expect(component.labels.length).toBe(0);
      expect(component.linkNodes.length).toBe(0);
      expect(component.links.length).toBe(0);
      expect(component.hasTextCapabilities).toBe(false);
    });
  });

  describe('openMenuForDrawing', () => {
    it('should reset capabilities before opening menu', () => {
      component.nodes = [createMockNode()];
      component.openMenuForDrawing(createMockDrawing(), 0, 0);
      expect(component.drawings.length).toBe(1);
      expect(component.nodes.length).toBe(0);
    });

    it('should set hasTextCapabilities to true when drawing has TextElement', () => {
      const drawing = createTextElementDrawing();
      component.openMenuForDrawing(drawing, 0, 0);
      expect(component.hasTextCapabilities).toBe(true);
    });

    it('should set hasTextCapabilities to false when drawing does not have TextElement', () => {
      const drawing = createMockDrawing({ element: null });
      component.openMenuForDrawing(drawing, 0, 0);
      expect(component.hasTextCapabilities).toBe(false);
    });

    it('should set drawings array with provided drawing', () => {
      const drawing = createMockDrawing({ drawing_id: 'drawing-999' });
      component.openMenuForDrawing(drawing, 0, 0);
      expect(component.drawings).toHaveLength(1);
      expect(component.drawings[0].drawing_id).toBe('drawing-999');
    });

    it('should call setPosition with provided coordinates', () => {
      component.openMenuForDrawing(createMockDrawing(), 150, 250);
      expect(component.topPosition).toBe('150px');
      expect(component.leftPosition).toBe('250px');
    });

    it('should open the menu', () => {
      component.openMenuForDrawing(createMockDrawing(), 0, 0);
      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });
  });

  describe('openMenuForNode', () => {
    it('should reset capabilities before opening menu', () => {
      component.drawings = [createMockDrawing()];
      component.openMenuForNode(createMockNode(), 0, 0);
      expect(component.drawings.length).toBe(0);
      expect(component.nodes.length).toBe(1);
    });

    it('should set nodes array with provided node', () => {
      const node = createMockNode({ node_id: 'node-999' });
      component.openMenuForNode(node, 0, 0);
      expect(component.nodes).toHaveLength(1);
      expect(component.nodes[0].node_id).toBe('node-999');
    });

    it('should call setPosition with provided coordinates', () => {
      component.openMenuForNode(createMockNode(), 300, 400);
      expect(component.topPosition).toBe('300px');
      expect(component.leftPosition).toBe('400px');
    });

    it('should open the menu', () => {
      component.openMenuForNode(createMockNode(), 0, 0);
      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });
  });

  describe('openMenuForLabel', () => {
    it('should reset capabilities before opening menu', () => {
      component.drawings = [createMockDrawing()];
      const node = createMockNode();
      const label = createMockLabel();
      component.openMenuForLabel(label, node, 0, 0);
      expect(component.drawings.length).toBe(0);
      expect(component.labels.length).toBe(1);
      expect(component.nodes.length).toBe(1);
    });

    it('should set both labels and nodes arrays', () => {
      const node = createMockNode({ node_id: 'node-888' });
      const label = createMockLabel({ text: 'Custom Label' });
      component.openMenuForLabel(label, node, 0, 0);
      expect(component.labels).toHaveLength(1);
      expect(component.labels[0].text).toBe('Custom Label');
      expect(component.nodes).toHaveLength(1);
      expect(component.nodes[0].node_id).toBe('node-888');
    });

    it('should call setPosition with provided coordinates', () => {
      const node = createMockNode();
      const label = createMockLabel();
      component.openMenuForLabel(label, node, 500, 600);
      expect(component.topPosition).toBe('500px');
      expect(component.leftPosition).toBe('600px');
    });

    it('should open the menu', () => {
      const node = createMockNode();
      const label = createMockLabel();
      component.openMenuForLabel(label, node, 0, 0);
      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });
  });

  describe('openMenuForInterfaceLabel', () => {
    it('should reset capabilities before opening menu', () => {
      component.drawings = [createMockDrawing()];
      const linkNode = createMockLinkNode();
      const link = createMockLink();
      component.openMenuForInterfaceLabel(linkNode, link, 0, 0);
      expect(component.drawings.length).toBe(0);
      expect(component.linkNodes.length).toBe(1);
      expect(component.links.length).toBe(1);
    });

    it('should set both linkNodes and links arrays', () => {
      const linkNode = createMockLinkNode({ node_id: 'node-777' });
      const link = createMockLink({ link_id: 'link-777' });
      component.openMenuForInterfaceLabel(linkNode, link, 0, 0);
      expect(component.linkNodes).toHaveLength(1);
      expect(component.linkNodes[0].node_id).toBe('node-777');
      expect(component.links).toHaveLength(1);
      expect(component.links[0].link_id).toBe('link-777');
    });

    it('should call setPosition with provided coordinates', () => {
      const linkNode = createMockLinkNode();
      const link = createMockLink();
      component.openMenuForInterfaceLabel(linkNode, link, 700, 800);
      expect(component.topPosition).toBe('700px');
      expect(component.leftPosition).toBe('800px');
    });

    it('should open the menu', () => {
      const linkNode = createMockLinkNode();
      const link = createMockLink();
      component.openMenuForInterfaceLabel(linkNode, link, 0, 0);
      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });
  });

  describe('openMenuForListOfElements', () => {
    it('should reset all collections before opening menu', () => {
      component.nodes = [createMockNode()];
      const drawings = [createMockDrawing()];
      const nodes = [createMockNode({ node_id: 'node-new' })];
      const labels = [createMockLabel()];
      const links = [createMockLink()];
      component.openMenuForListOfElements(drawings, nodes, labels, links, 0, 0);
      expect(component.nodes.length).toBe(1);
      expect(component.nodes[0].node_id).toBe('node-new');
      expect(component.drawings.length).toBe(1);
      expect(component.labels.length).toBe(1);
      expect(component.links.length).toBe(1);
    });

    it('should set all element collections', () => {
      const drawings = [createMockDrawing({ drawing_id: 'd1' }), createMockDrawing({ drawing_id: 'd2' })];
      const nodes = [createMockNode({ node_id: 'n1' }), createMockNode({ node_id: 'n2' })];
      const labels = [createMockLabel({ text: 'l1' })];
      const links = [createMockLink({ link_id: 'link1' })];
      component.openMenuForListOfElements(drawings, nodes, labels, links, 0, 0);
      expect(component.drawings).toHaveLength(2);
      expect(component.nodes).toHaveLength(2);
      expect(component.labels).toHaveLength(1);
      expect(component.links).toHaveLength(1);
    });

    it('should call setPosition with provided coordinates', () => {
      component.openMenuForListOfElements([], [], [], [], 900, 1000);
      expect(component.topPosition).toBe('900px');
      expect(component.leftPosition).toBe('1000px');
    });

    it('should open the menu', () => {
      component.openMenuForListOfElements([], [], [], [], 0, 0);
      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });

    it('should handle empty collections', () => {
      component.openMenuForListOfElements([], [], [], [], 0, 0);
      expect(component.drawings).toHaveLength(0);
      expect(component.nodes).toHaveLength(0);
      expect(component.labels).toHaveLength(0);
      expect(component.links).toHaveLength(0);
    });
  });

  describe('integration behaviors', () => {
    it('should clear previous selections when opening different menu types', () => {
      // Open for node first
      const node = createMockNode();
      component.openMenuForNode(node, 0, 0);
      expect(component.nodes).toHaveLength(1);
      expect(component.drawings).toHaveLength(0);

      // Then open for drawing
      const drawing = createMockDrawing();
      component.openMenuForDrawing(drawing, 0, 0);
      expect(component.drawings).toHaveLength(1);
      expect(component.nodes).toHaveLength(0);
    });

    it('should handle multiple consecutive openMenuForNode calls', () => {
      const node1 = createMockNode({ node_id: 'node-1' });
      const node2 = createMockNode({ node_id: 'node-2' });

      component.openMenuForNode(node1, 0, 0);
      expect(component.nodes[0].node_id).toBe('node-1');

      component.openMenuForNode(node2, 10, 20);
      expect(component.nodes[0].node_id).toBe('node-2');
      expect(mockMenuTrigger.openMenu).toHaveBeenCalledTimes(2);
    });
  });
});
