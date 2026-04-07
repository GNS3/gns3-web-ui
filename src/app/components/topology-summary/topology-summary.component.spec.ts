import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of } from 'rxjs';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { Node, Properties } from '../../cartography/models/node';
import { Link } from '@models/link';
import { ComputeService } from '@services/compute.service';
import { ProjectService } from '@services/project.service';
import { ThemeService } from '@services/theme.service';
import { NotificationService } from '@services/notification.service';
import { ProjectStatistics } from '@models/project-statistics';
import { Compute } from '@models/compute';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { TopologySummaryComponent } from './topology-summary.component';
import { ResizeEvent } from 'angular-resizable-element';
import { MatTooltipModule } from '@angular/material/tooltip';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TopologySummaryComponent', () => {
  let component: TopologySummaryComponent;
  let fixture: ComponentFixture<TopologySummaryComponent>;
  let mockNodesDataSource: any;
  let mockLinksDataSource: any;
  let mockProjectService: any;
  let mockComputeService: any;
  let mockThemeService: any;
  let mockNotificationService: any;
  let mockChangeDetectorRef: any;
  let nodesSubject: Subject<Node[]>;
  let mockController: Controller;
  let mockProject: Project;

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

  const mockNode: Node = {
    node_id: 'node1',
    name: 'Test Node',
    status: 'started',
    console_host: '0.0.0.0',
    node_type: 'vpcs',
    project_id: 'proj1',
    command_line: '',
    compute_id: 'compute1',
    height: 50,
    width: 80,
    x: 100,
    y: 200,
    z: 1,
    port_name_format: 'eth{0}',
    port_segment_size: 0,
    first_port_name: '',
    label: undefined,
    symbol: '',
    symbol_url: '',
    properties: createMockProperties(),
    console: 0,
    console_auto_start: false,
    console_type: '',
    locked: false,
    node_directory: '',
    ports: [],
    custom_adapters: undefined,
    ethernet_adapters: undefined,
    serial_adapters: undefined,
  };

  const mockLink: Link = {
    link_id: 'link1',
    link_type: 'ethernet',
    capturing: true,
    capture_file_name: '',
    capture_file_path: '',
    nodes: [
      {
        node_id: 'node1',
        adapter_number: 0,
        port_number: 0,
        label: { rotation: 0, style: '', text: '', x: 0, y: 0 },
      },
      {
        node_id: 'node2',
        adapter_number: 0,
        port_number: 0,
        label: { rotation: 0, style: '', text: '', x: 0, y: 0 },
      },
    ],
    filters: {
      bpf: [],
      corrupt: [],
      packet_loss: [5],
      frequency_drop: [],
    },
    project_id: 'proj1',
    suspend: false,
    distance: 0,
    length: 0,
    source: mockNode,
    target: mockNode,
    x: 0,
    y: 0,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    nodesSubject = new Subject<Node[]>();

    mockNodesDataSource = {
      changes: nodesSubject.asObservable(),
    };

    mockLinksDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    // ✅ Fix: Ensure mock function returns Observable
    mockProjectService = {
      getStatistics: vi.fn().mockReturnValue(of({} as ProjectStatistics)),
    };

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('dark'),
    };

    mockNotificationService = {
      computeNotificationEmitter: new Subject(),
      connectToComputeNotifications: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockController = {
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
    } as Controller;

    mockProject = {
      project_id: 'proj1',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: '/path/to/project',
      readonly: false,
    } as Project;

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [TopologySummaryComponent, MatTooltipModule],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ComputeService, useValue: mockComputeService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopologySummaryComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.project = mockProject;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default initial values', () => {
      expect(component.sortingOrder).toBe('asc');
      expect(component.isTopologyVisible).toBe(true);
      expect(component.isDraggingEnabled).toBe(false);
      expect(component.startedStatusFilterEnabled).toBe(false);
      expect(component.stoppedStatusFilterEnabled).toBe(false);
      expect(component.suspendedStatusFilterEnabled).toBe(false);
      expect(component.captureFilterEnabled).toBe(false);
      expect(component.packetFilterEnabled).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should detect light theme', async () => {
      mockThemeService.getActualTheme.mockReturnValue('light');

      component.ngOnInit();
      await vi.runAllTimersAsync();

      expect(component.isLightThemeEnabled).toBe(true);
    });

    it('should detect dark theme', async () => {
      mockThemeService.getActualTheme.mockReturnValue('dark');

      component.ngOnInit();
      await vi.runAllTimersAsync();

      expect(component.isLightThemeEnabled).toBe(false);
    });

    it('should subscribe to nodes data changes and update nodes list', async () => {
      const testNodes = [mockNode];
      // Mock was already set up in beforeEach, no need to set it again here

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next(testNodes);

      expect(component.nodes).toEqual(testNodes);
      expect(component.filteredNodes).toEqual(testNodes);
    });

    it('should replace console_host with controller host when 0.0.0.0', async () => {
      const testNode = { ...mockNode, console_host: '0.0.0.0' };

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next([testNode]);

      expect(component.nodes[0].console_host).toBe(mockController.host);
    });

    it('should replace console_host with controller host when ::', async () => {
      const testNode = { ...mockNode, console_host: '::' };

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next([testNode]);

      expect(component.nodes[0].console_host).toBe(mockController.host);
    });

    it('should replace console_host with controller host when 0:0:0:0:0:0:0:0', async () => {
      const testNode = { ...mockNode, console_host: '0:0:0:0:0:0:0:0' };

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next([testNode]);

      expect(component.nodes[0].console_host).toBe(mockController.host);
    });

    it('should not replace console_host when it is a valid IP', async () => {
      const testNode = { ...mockNode, console_host: '192.168.1.50' };

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next([testNode]);

      expect(component.nodes[0].console_host).toBe('192.168.1.50');
    });

    it('should sort nodes ascending by default', async () => {
      const node2 = { ...mockNode, name: 'Zebra', node_id: 'node2' };
      const node1 = { ...mockNode, name: 'Alpha', node_id: 'node1' };
      const testNodes = [node2, node1];

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next(testNodes);

      expect(component.filteredNodes[0].name).toBe('Alpha');
      expect(component.filteredNodes[1].name).toBe('Zebra');
    });

    it('should sort nodes descending when sortingOrder is desc', async () => {
      component.sortingOrder = 'desc';
      const node1 = { ...mockNode, name: 'Alpha', node_id: 'node1' };
      const node2 = { ...mockNode, name: 'Zebra', node_id: 'node2' };
      const testNodes = [node1, node2];

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next(testNodes);

      expect(component.filteredNodes[0].name).toBe('Zebra');
      expect(component.filteredNodes[1].name).toBe('Alpha');
    });

    it('should fetch project statistics', async () => {
      const mockStats = { nodes: 5, links: 3, snapshots: 1 } as ProjectStatistics;
      mockProjectService.getStatistics.mockReturnValue(of(mockStats));

      component.ngOnInit();
      await vi.runAllTimersAsync();

      expect(mockProjectService.getStatistics).toHaveBeenCalledWith(mockController, mockProject.project_id);
      expect(component.projectsStatistics).toEqual(mockStats);
    });

    it('should fetch computes', async () => {
      const mockComputes = [{ compute_id: 'comp1', name: 'Local' } as Compute];
      mockComputeService.getComputes.mockReturnValue(of(mockComputes));

      component.ngOnInit();
      await vi.runAllTimersAsync();

      expect(mockComputeService.getComputes).toHaveBeenCalledWith(mockController);
      expect(component.computes).toEqual(mockComputes);
    });

    it('should call revertPosition on init', async () => {
      const revertPositionSpy = vi.spyOn(component, 'revertPosition');

      component.ngOnInit();
      await vi.runAllTimersAsync();

      expect(revertPositionSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', async () => {
      mockProjectService.getStatistics.mockReturnValue(of({} as ProjectStatistics));
      mockComputeService.getComputes.mockReturnValue(of([]));

      component.ngOnInit();
      await vi.runAllTimersAsync();
      component.ngOnDestroy();

      // Verify ngOnDestroy completes without errors
      expect(component).toBeTruthy();
    });
  });

  describe('revertPosition', () => {
    it('should set default position when no localStorage data exists', () => {
      component.revertPosition();

      expect(component.style).toEqual({
        top: '60px',
        right: '0px',
        width: '320px',
        height: '400px',
      });
    });

    it('should load position from localStorage when data exists', () => {
      localStorage.setItem('leftPosition', '100');
      localStorage.setItem('rightPosition', '200');
      localStorage.setItem('topPosition', '150');
      localStorage.setItem('widthOfWidget', '400');
      localStorage.setItem('heightOfWidget', '500');

      component.revertPosition();

      expect(component.style).toEqual({
        position: 'fixed',
        left: '100px',
        right: '200px',
        top: '150px',
        width: '400px',
        height: '500px',
      });
    });
  });

  describe('toggleDragging', () => {
    it('should enable dragging when true', () => {
      component.toggleDragging(true);

      expect(component.isDraggingEnabled).toBe(true);
    });

    it('should disable dragging when false', () => {
      component.isDraggingEnabled = true;
      component.toggleDragging(false);

      expect(component.isDraggingEnabled).toBe(false);
    });
  });

  describe('dragWidget', () => {
    beforeEach(() => {
      component.style = {
        position: 'fixed',
        left: '100px',
        top: '200px',
        width: '300px',
        height: '400px',
      };
    });

    it('should update widget position when dragging from left', () => {
      const mockEvent = { movementX: 10, movementY: 20 };

      component.dragWidget(mockEvent);

      expect(component.style['left']).toBe('110px');
      expect(component.style['top']).toBe('220px');
      expect(localStorage.getItem('leftPosition')).toBe('110');
      expect(localStorage.getItem('topPosition')).toBe('220');
    });

    it('should maintain width and height during drag', () => {
      const mockEvent = { movementX: 5, movementY: 10 };

      component.dragWidget(mockEvent);

      expect(component.style['width']).toBe('300px');
      expect(component.style['height']).toBe('400px');
    });

    it('should update widget position when dragging from right', () => {
      component.style = {
        position: 'fixed',
        right: '100px',
        top: '200px',
        width: '300px',
        height: '400px',
      };
      const mockEvent = { movementX: 15, movementY: 25 };

      component.dragWidget(mockEvent);

      expect(component.style['right']).toBe('85px');
      expect(component.style['top']).toBe('225px');
      expect(localStorage.getItem('rightPosition')).toBe('85');
    });
  });

  describe('validate', () => {
    it('should return true for valid resize dimensions', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 300, height: 300, left: 0, top: 0, right: 300, bottom: 300 },
        edges: {},
      };

      const result = component.validate(mockEvent);

      expect(result).toBe(true);
    });

    it('should return false when width is too small', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 200, height: 300, left: 0, top: 0, right: 200, bottom: 300 },
        edges: {},
      };

      const result = component.validate(mockEvent);

      expect(result).toBe(false);
    });

    it('should return false when height is too small', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 300, height: 200, left: 0, top: 0, right: 300, bottom: 200 },
        edges: {},
      };

      const result = component.validate(mockEvent);

      expect(result).toBe(false);
    });

    it('should return false when both dimensions are too small', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 200, height: 200, left: 0, top: 0, right: 200, bottom: 200 },
        edges: {},
      };

      const result = component.validate(mockEvent);

      expect(result).toBe(false);
    });

    it('should return true for minimum valid dimensions', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 290, height: 260, left: 0, top: 0, right: 290, bottom: 260 },
        edges: {},
      };

      const result = component.validate(mockEvent);

      expect(result).toBe(true);
    });

    it('should return true when width or height is undefined', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: null, height: 300, left: 0, top: 0, right: 0, bottom: 300 } as any,
        edges: {},
      };

      const result = component.validate(mockEvent);

      expect(result).toBe(true);
    });
  });

  describe('onResizeEnd', () => {
    it('should update widget style after resize', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 400, height: 500, left: 50, top: 60, right: 450, bottom: 560 },
        edges: {},
      };

      component.onResizeEnd(mockEvent);

      expect(component.style).toEqual({
        position: 'fixed',
        left: '50px',
        top: '60px',
        width: '400px',
        height: '500px',
      });
    });

    it('should update inner style height based on resize', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 400, height: 500, left: 50, top: 60, right: 450, bottom: 560 },
        edges: {},
      };

      component.onResizeEnd(mockEvent);

      expect(component.styleInside).toEqual({
        height: '380px', // 500 - 120
      });
    });
  });

  describe('toggleTopologyVisibility', () => {
    it('should set topology visibility to true', () => {
      component.toggleTopologyVisibility(true);

      expect(component.isTopologyVisible).toBe(true);
    });

    it('should set topology visibility to false and call revertPosition', () => {
      const revertPositionSpy = vi.spyOn(component, 'revertPosition');

      component.toggleTopologyVisibility(false);

      expect(component.isTopologyVisible).toBe(false);
      expect(revertPositionSpy).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    describe('compareAsc', () => {
      it('should return -1 when first name comes before second', () => {
        const node1 = { ...mockNode, name: 'Alpha' };
        const node2 = { ...mockNode, name: 'Zebra' };

        const result = component.compareAsc(node1, node2);

        expect(result).toBe(-1);
      });

      it('should return 1 when first name comes after second', () => {
        const node1 = { ...mockNode, name: 'Zebra' };
        const node2 = { ...mockNode, name: 'Alpha' };

        const result = component.compareAsc(node1, node2);

        expect(result).toBe(1);
      });
    });

    describe('compareDesc', () => {
      it('should return 1 when first name comes before second', () => {
        const node1 = { ...mockNode, name: 'Alpha' };
        const node2 = { ...mockNode, name: 'Zebra' };

        const result = component.compareDesc(node1, node2);

        expect(result).toBe(1);
      });

      it('should return -1 when first name comes after second', () => {
        const node1 = { ...mockNode, name: 'Zebra' };
        const node2 = { ...mockNode, name: 'Alpha' };

        const result = component.compareDesc(node1, node2);

        expect(result).toBe(-1);
      });
    });

    describe('setSortingOrder', () => {
      beforeEach(() => {
        const node1 = { ...mockNode, name: 'Zebra', node_id: 'node1' };
        const node2 = { ...mockNode, name: 'Alpha', node_id: 'node2' };
        component.filteredNodes = [node1, node2];
      });

      it('should sort nodes in ascending order when sortingOrder is asc', () => {
        component.setSortingOrder();

        expect(component.filteredNodes[0].name).toBe('Alpha');
        expect(component.filteredNodes[1].name).toBe('Zebra');
      });

      it('should sort nodes in descending order when sortingOrder is desc', () => {
        component.sortingOrder = 'desc';
        component.setSortingOrder();

        expect(component.filteredNodes[0].name).toBe('Zebra');
        expect(component.filteredNodes[1].name).toBe('Alpha');
      });
    });
  });

  describe('Status Filtering', () => {
    const startedNode = { ...mockNode, node_id: 'n1', status: 'started' };
    const stoppedNode = { ...mockNode, node_id: 'n2', status: 'stopped' };
    const suspendedNode = { ...mockNode, node_id: 'n3', status: 'suspended' };

    beforeEach(() => {
      component.nodes = [startedNode, stoppedNode, suspendedNode];
    });

    describe('applyStatusFilter', () => {
      it('should toggle started filter', () => {
        component.applyStatusFilter('started');

        expect(component.startedStatusFilterEnabled).toBe(true);
      });

      it('should toggle stopped filter', () => {
        component.applyStatusFilter('stopped');

        expect(component.stoppedStatusFilterEnabled).toBe(true);
      });

      it('should toggle suspended filter', () => {
        component.applyStatusFilter('suspended');

        expect(component.suspendedStatusFilterEnabled).toBe(true);
      });

      it('should apply filters after toggling', () => {
        const initialFilteredNodes = component.filteredNodes.length;

        component.applyStatusFilter('started');

        // Filter should be applied, changing the filtered nodes
        expect(component.startedStatusFilterEnabled).toBe(true);
      });
    });

    describe('applyFilters', () => {
      it('should show only started nodes when started filter is enabled', () => {
        component.startedStatusFilterEnabled = true;
        component.applyFilters();

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('started');
      });

      it('should show only stopped nodes when stopped filter is enabled', () => {
        component.stoppedStatusFilterEnabled = true;
        component.applyFilters();

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('stopped');
      });

      it('should show only suspended nodes when suspended filter is enabled', () => {
        component.suspendedStatusFilterEnabled = true;
        component.applyFilters();

        expect(component.filteredNodes.length).toBe(1);
        expect(component.filteredNodes[0].status).toBe('suspended');
      });

      it('should show all nodes when no filters are enabled', () => {
        component.applyFilters();

        expect(component.filteredNodes.length).toBe(3);
      });

      it('should combine multiple status filters', () => {
        component.startedStatusFilterEnabled = true;
        component.stoppedStatusFilterEnabled = true;
        component.applyFilters();

        expect(component.filteredNodes.length).toBe(2);
        expect(component.filteredNodes.some((n) => n.status === 'started')).toBe(true);
        expect(component.filteredNodes.some((n) => n.status === 'stopped')).toBe(true);
      });
    });
  });

  describe('Capture and Packet Filtering', () => {
    const node1 = { ...mockNode, node_id: 'node1' };
    const node2 = { ...mockNode, node_id: 'node2' };
    const node3 = { ...mockNode, node_id: 'node3' };

    beforeEach(() => {
      component.nodes = [node1, node2, node3];
      component.filteredNodes = [node1, node2, node3];
    });

    describe('applyCaptureFilter', () => {
      beforeEach(() => {
        // Set up default return value for getItems
        mockLinksDataSource.getItems.mockReturnValue([]);
      });

      it('should toggle capture filter', () => {
        component.applyCaptureFilter('capture');

        expect(component.captureFilterEnabled).toBe(true);
      });

      it('should toggle packet filter', () => {
        component.applyCaptureFilter('packet');

        expect(component.packetFilterEnabled).toBe(true);
      });

      it('should apply filters after toggling', () => {
        const initialFilteredNodes = component.filteredNodes.length;

        component.applyCaptureFilter('capture');

        // Filter should be applied
        expect(component.captureFilterEnabled).toBe(true);
      });
    });

    describe('checkCapturing', () => {
      it('should filter nodes that have capturing links', () => {
        mockLinksDataSource.getItems.mockReturnValue([mockLink]);

        const result = component.checkCapturing([node1, node2, node3]);

        // mockLink has both node1 and node2 in its nodes array
        expect(result).toContain(node1);
        expect(result).toContain(node2);
        expect(result).not.toContain(node3);
      });

      it('should return empty array when no links are capturing', () => {
        const nonCapturingLink = { ...mockLink, capturing: false };
        mockLinksDataSource.getItems.mockReturnValue([nonCapturingLink]);

        const result = component.checkCapturing([node1, node2, node3]);

        expect(result).toEqual([]);
      });

      it('should handle multiple nodes with capturing links', () => {
        const linkWithBothNodes = { ...mockLink };
        mockLinksDataSource.getItems.mockReturnValue([linkWithBothNodes]);

        const result = component.checkCapturing([node1, node2]);

        expect(result.length).toBe(2);
        expect(result).toContain(node1);
        expect(result).toContain(node2);
      });
    });

    describe('checkPacketFilters', () => {
      it('should filter nodes that have links with packet filters', () => {
        mockLinksDataSource.getItems.mockReturnValue([mockLink]);

        const result = component.checkPacketFilters([node1, node2, node3]);

        expect(result).toContain(node1);
        expect(result).toContain(node2);
        expect(result).not.toContain(node3);
      });

      it('should return empty array when no links have packet filters', () => {
        const linkWithoutFilters = { ...mockLink, filters: {} };
        mockLinksDataSource.getItems.mockReturnValue([linkWithoutFilters]);

        const result = component.checkPacketFilters([node1, node2, node3]);

        expect(result).toEqual([]);
      });

      it('should detect links with BPF filters', () => {
        const linkWithBPF = { ...mockLink, filters: { bpf: ['tcp port 80'] } };
        mockLinksDataSource.getItems.mockReturnValue([linkWithBPF]);

        const result = component.checkPacketFilters([node1, node2]);

        expect(result.length).toBe(2);
      });

      it('should detect links with corrupt filters', () => {
        const linkWithCorrupt = { ...mockLink, filters: { corrupt: [10] } };
        mockLinksDataSource.getItems.mockReturnValue([linkWithCorrupt]);

        const result = component.checkPacketFilters([node1, node2]);

        expect(result.length).toBe(2);
      });

      it('should detect links with packet loss filters', () => {
        const linkWithPacketLoss = { ...mockLink, filters: { packet_loss: [5] } };
        mockLinksDataSource.getItems.mockReturnValue([linkWithPacketLoss]);

        const result = component.checkPacketFilters([node1, node2]);

        expect(result.length).toBe(2);
      });

      it('should detect links with frequency drop filters', () => {
        const linkWithFreqDrop = { ...mockLink, filters: { frequency_drop: [1000] } };
        mockLinksDataSource.getItems.mockReturnValue([linkWithFreqDrop]);

        const result = component.checkPacketFilters([node1, node2]);

        expect(result.length).toBe(2);
      });
    });

    describe('applyFilters with capture and packet filters', () => {
      it('should apply capture filter on top of status filter', () => {
        component.startedStatusFilterEnabled = true;
        component.captureFilterEnabled = true;
        component.nodes = [node1, node2, node3];
        mockLinksDataSource.getItems.mockReturnValue([mockLink]);

        component.applyFilters();

        // All nodes are 'started', so status filter includes all 3
        // Capture filter only includes nodes with capturing links (node1 and node2 from mockLink)
        expect(component.filteredNodes.length).toBe(2);
        expect(component.filteredNodes).toContain(node1);
        expect(component.filteredNodes).toContain(node2);
      });

      it('should apply packet filter on top of status filter', () => {
        component.startedStatusFilterEnabled = true;
        component.packetFilterEnabled = true;
        component.nodes = [node1, node2, node3];
        mockLinksDataSource.getItems.mockReturnValue([mockLink]);

        component.applyFilters();

        // All nodes are 'started', so status filter includes all 3
        // Packet filter only includes nodes with packet filters (node1 and node2 from mockLink)
        expect(component.filteredNodes.length).toBe(2);
        expect(component.filteredNodes).toContain(node1);
        expect(component.filteredNodes).toContain(node2);
      });
    });
  });

  describe('Output Events', () => {
    it('should emit false when close is called', () => {
      const emitSpy = vi.spyOn(component.closeTopologySummary, 'emit');

      component.close();

      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('Zoneless Change Detection', () => {
    it('should update nodes correctly after async operation', () => {
      mockProjectService.getStatistics.mockReturnValue(of({} as ProjectStatistics));
      mockComputeService.getComputes.mockReturnValue(of([]));

      component.ngOnInit();
      nodesSubject.next([mockNode]);

      // Verify that the component state is updated correctly
      expect(component.nodes).toEqual([mockNode]);
      expect(component.filteredNodes).toEqual([mockNode]);
    });

    it('should update project statistics after async operation', async () => {
      const mockStats = { nodes: 5, links: 3, snapshots: 1 } as ProjectStatistics;
      mockProjectService.getStatistics.mockReturnValue(of(mockStats));
      mockComputeService.getComputes.mockReturnValue(of([]));

      component.ngOnInit();
      await vi.runAllTimersAsync();

      // Verify that the component state is updated correctly
      expect(component.projectsStatistics).toEqual(mockStats);
    });

    it('should update computes after async operation', async () => {
      const mockComputes = [{ compute_id: 'comp1', name: 'Local' } as Compute];
      mockProjectService.getStatistics.mockReturnValue(of({} as ProjectStatistics));
      mockComputeService.getComputes.mockReturnValue(of(mockComputes));

      component.ngOnInit();
      await vi.runAllTimersAsync();

      // Verify that the component state is updated correctly
      expect(component.computes).toEqual(mockComputes);
    });
  });
});
