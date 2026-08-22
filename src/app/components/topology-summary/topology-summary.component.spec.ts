import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { Node, Properties } from '../../cartography/models/node';
import { Link } from '@models/link';
import { ComputeService } from '@services/compute.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { MarkerRegistryService } from '@services/marker-registry.service';
import { Compute } from '@models/compute';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { TopologySummaryComponent } from './topology-summary.component';
import { ResizeEvent } from 'angular-resizable-element';
import { MatTooltipModule } from '@angular/material/tooltip';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TopologySummaryComponent', () => {
  let component: TopologySummaryComponent;
  let fixture: ComponentFixture<TopologySummaryComponent>;
  let mockNodesDataSource: any;
  let mockLinksDataSource: any;
  let mockComputeService: any;
  let mockNotificationService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let mockNodeConsoleService: any;
  let mockMapSettingsService: any;
  let nodesSubject: Subject<Node[]>;
  let mockController: Controller;

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
    wireshark: false,
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
    show_filters_icon: true,
  };

  const mockProject: Project = {
    project_id: 'proj1',
    name: 'Test Project',
    filename: '',
    path: '',
    status: 'opened',
    created_by: '',
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

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    mockNotificationService = {
      hasCachedData: vi.fn().mockReturnValue(false),
      getCachedComputes: vi.fn().mockReturnValue([]),
      setInitialComputes: vi.fn(),
      computeCacheUpdated: new Subject(),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockNodeConsoleService = {
      openConsoleForNode: vi.fn(),
    };

    mockMapSettingsService = {
      logConsoleSubject: new Subject<boolean>(),
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

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [TopologySummaryComponent, MatTooltipModule],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: ComputeService, useValue: mockComputeService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        MarkerRegistryService,
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
    delete document.documentElement.dataset['density'];
    vi.useRealTimers();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default initial values', () => {
      expect(component.sortingOrder).toBe('asc');
      expect(component.selectedTabIndex).toBe(0);
      expect(component.isDraggingEnabled).toBe(false);
      expect(component.startedStatusFilterEnabled).toBe(false);
      expect(component.stoppedStatusFilterEnabled).toBe(false);
      expect(component.suspendedStatusFilterEnabled).toBe(false);
      expect(component.captureFilterEnabled).toBe(false);
      expect(component.packetFilterEnabled).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to nodes data changes and update nodes list', async () => {
      const testNodes = [{ ...mockNode, console_host: '192.168.1.50' }];

      component.ngOnInit();
      await vi.runAllTimersAsync();
      nodesSubject.next(testNodes);

      expect(component.nodes).toEqual(testNodes);
      expect(component.filteredNodes).toEqual(testNodes);
    });

    it('should normalize wildcard console hosts without mutating datasource nodes', async () => {
      const testNode = { ...mockNode, console_host: '0.0.0.0' };

      component.ngOnInit();
      nodesSubject.next([testNode]);

      expect(component.nodes[0].console_host).toBe(mockController.host);
      expect(testNode.console_host).toBe('0.0.0.0');
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

    it('should fetch computes', async () => {
      const mockComputes = [{ compute_id: 'comp1', name: 'Local' } as Compute];
      mockComputeService.getComputes.mockReturnValue(of(mockComputes));

      component.ngOnInit();
      await vi.runAllTimersAsync();

      expect(mockComputeService.getComputes).toHaveBeenCalledWith(mockController);
      expect(component.computes).toEqual(mockComputes);
    });

    it('should fetch computes even when the notification cache already has data', async () => {
      // Regression guard: the cache only contains computes that happened to
      // emit a WS event, so it must never replace the authoritative HTTP list
      // (otherwise the local compute never shows up).
      mockNotificationService.hasCachedData.mockReturnValue(true);
      mockNotificationService.getCachedComputes.mockReturnValue([
        { compute_id: 'remote', name: 'Remote' } as Compute,
      ]);
      const mockComputes = [
        { compute_id: 'local', name: 'Local' } as Compute,
        { compute_id: 'remote', name: 'Remote' } as Compute,
      ];
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
      mockComputeService.getComputes.mockReturnValue(of([]));

      component.ngOnInit();
      await vi.runAllTimersAsync();
      component.ngOnDestroy();

      // Verify ngOnDestroy completes without errors
      expect(component).toBeTruthy();
    });

    it('should cancel an in-flight compute request when destroyed', () => {
      const computeRequest = new Subject<Compute[]>();
      mockComputeService.getComputes.mockReturnValue(computeRequest);

      component.ngOnInit();
      component.ngOnDestroy();
      computeRequest.next([{ compute_id: 'late-compute', name: 'Late' } as Compute]);

      expect(component.computes).toEqual([]);
    });
  });

  describe('revertPosition', () => {
    it('should set default position when no localStorage data exists', () => {
      component.revertPosition();

      expect(component.style).toEqual({
        top: '68px',
        right: '16px',
        width: '720px',
        height: '680px',
      });
    });

    it('should load position from localStorage when data exists', () => {
      localStorage.setItem('leftPosition', '100');
      localStorage.setItem('topPosition', '150');
      localStorage.setItem('widthOfWidget', '600');
      localStorage.setItem('heightOfWidget', '500');

      component.revertPosition();

      expect(component.style).toEqual({
        position: 'fixed',
        left: '100px',
        top: '150px',
        width: '600px',
        height: '500px',
      });
    });

    it('should clamp a saved position and size to the viewport', () => {
      localStorage.setItem('leftPosition', '5000');
      localStorage.setItem('topPosition', '5000');
      localStorage.setItem('widthOfWidget', '5000');
      localStorage.setItem('heightOfWidget', '5000');

      component.revertPosition();

      expect(component.style['left']).toBe('0px');
      expect(component.style['top']).toBe('0px');
      expect(component.style['width']).toBe(`${window.innerWidth}px`);
      expect(component.style['height']).toBe(`${window.innerHeight}px`);
    });

    it('should align the default inspector with the compact project header', () => {
      document.documentElement.dataset['density'] = 'compact';

      component.revertPosition();

      expect(component.style['top']).toBe('56px');
      expect(component.style['right']).toBe('8px');
    });

    it('should fit the inspector below the project header on narrow viewports', () => {
      const widthSpy = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(600);
      const heightSpy = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);

      component.onViewportResize();

      expect(component.style).toEqual({
        position: 'fixed',
        top: '56px',
        left: '0px',
        width: '600px',
        height: '744px',
      });

      widthSpy.mockRestore();
      heightSpy.mockRestore();
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
      expect(localStorage.getItem('rightPosition')).toBeNull();
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
      expect(localStorage.getItem('leftPosition')).toBeNull();
    });

    it('should keep the widget within the viewport while dragging', () => {
      component.dragWidget({ movementX: -5000, movementY: -5000 } as MouseEvent);

      expect(component.style['left']).toBe('0px');
      expect(component.style['top']).toBe('0px');
    });
  });

  describe('validate', () => {
    it('should return true for valid resize dimensions', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 600, height: 500, left: 0, top: 0, right: 600, bottom: 500 },
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
        rectangle: { width: 400, height: 420, left: 0, top: 0, right: 400, bottom: 420 },
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

    it('should persist geometry after resize', () => {
      const mockEvent: ResizeEvent = {
        rectangle: { width: 400, height: 500, left: 50, top: 60, right: 450, bottom: 560 },
        edges: {},
      };

      component.onResizeEnd(mockEvent);

      expect(localStorage.getItem('leftPosition')).toBe('50');
      expect(localStorage.getItem('topPosition')).toBe('60');
      expect(localStorage.getItem('widthOfWidget')).toBe('400');
      expect(localStorage.getItem('heightOfWidget')).toBe('500');
    });
  });

  describe('onTabSelectionChange', () => {
    it('should select the requested tab', () => {
      component.onTabSelectionChange(1);

      expect(component.selectedTabIndex).toBe(1);
    });

    it('should select the computes tab without resetting the inspector position', () => {
      const revertPositionSpy = vi.spyOn(component, 'revertPosition');

      component.onTabSelectionChange(2);

      expect(component.selectedTabIndex).toBe(2);
      expect(revertPositionSpy).not.toHaveBeenCalled();
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
        component.nodes = [node1, node2];
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

  describe('Inspector interactions', () => {
    it('should render even before project statistics are available', () => {
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.topology-inspector')).toBeTruthy();
    });

    it('should render the dense inspector without title or footer chrome', () => {
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.inspector-header')).toBeNull();
      expect(fixture.nativeElement.querySelector('.inspector-footer')).toBeNull();
      expect(fixture.nativeElement.querySelector('.node-count')).toBeNull();
    });

    it('should show protocol and port columns without node type or status chips', () => {
      component.filteredNodes = [
        { ...mockNode, name: 'Console node', node_type: 'vpcs', console_type: 'telnet', console: 5000 },
        { ...mockNode, node_id: 'no-console', name: 'No console node', console_type: 'none', console: null },
      ];
      fixture.detectChanges();

      const tableText = fixture.nativeElement.querySelector('.node-table').textContent;
      expect(tableText).toContain('Protocol');
      expect(tableText).toContain('Port');
      expect(tableText).toContain('telnet');
      expect(tableText).toContain('5000');
      expect(tableText).toContain('none');
      expect(tableText).not.toContain('vpcs');
      expect(fixture.nativeElement.querySelector('.status-badge')).toBeNull();
    });

    it('should filter nodes by name without changing the source collection', () => {
      const alpha = { ...mockNode, node_id: 'alpha', name: 'Alpha' };
      const beta = { ...mockNode, node_id: 'beta', name: 'Beta' };
      component.nodes = [alpha, beta];

      component.setSearchQuery('alp');

      expect(component.filteredNodes).toEqual([alpha]);
      expect(component.nodes).toEqual([alpha, beta]);
    });

    it('should refresh or clear the selected node when datasource nodes change', () => {
      const original = { ...mockNode, status: 'started' };
      const updated = { ...original, status: 'stopped' };
      component.ngOnInit();
      nodesSubject.next([original]);
      component.selectNode(component.nodes[0]);

      nodesSubject.next([updated]);

      expect(component.selectedNode).toBe(component.nodes[0]);
      expect(component.selectedNode?.status).toBe('stopped');

      nodesSubject.next([]);
      expect(component.selectedNode).toBeNull();
    });

    it('should consume real-time compute cache updates once', () => {
      const computes = [{ compute_id: 'updated-compute', name: 'Updated' } as Compute];
      component.ngOnInit();

      mockNotificationService.computeCacheUpdated.next(computes);

      expect(component.computes).toEqual(computes);
    });

    it('should open a started terminal console through the existing console service', () => {
      const node = { ...mockNode, status: 'started', console_type: 'telnet', console: 5000 };
      const visibilitySpy = vi.spyOn(mockMapSettingsService.logConsoleSubject, 'next');

      component.openConsole(node);

      expect(visibilitySpy).toHaveBeenCalledWith(true);
      expect(mockNodeConsoleService.openConsoleForNode).toHaveBeenCalledWith(node);
    });

    it('should reject console opening for a stopped node', () => {
      component.openConsole({ ...mockNode, status: 'stopped', console_type: 'telnet' });

      expect(mockToasterService.error).toHaveBeenCalledWith('To open console please start the node');
      expect(mockNodeConsoleService.openConsoleForNode).not.toHaveBeenCalled();
    });

    describe('canOpenConsole', () => {
      it('should allow started vnc nodes', () => {
        expect(component.canOpenConsole({ ...mockNode, status: 'started', console_type: 'vnc' })).toBe(true);
      });

      it('should allow started http nodes', () => {
        expect(component.canOpenConsole({ ...mockNode, status: 'started', console_type: 'http' })).toBe(true);
      });

      it('should reject stopped vnc nodes', () => {
        expect(component.canOpenConsole({ ...mockNode, status: 'stopped', console_type: 'vnc' })).toBe(false);
      });

      it('should reject nodes without a console type', () => {
        expect(component.canOpenConsole({ ...mockNode, status: 'started', console_type: 'none' })).toBe(false);
        expect(component.canOpenConsole({ ...mockNode, status: 'started', console_type: '' })).toBe(false);
      });

      it('should reject a null node', () => {
        expect(component.canOpenConsole(null)).toBe(false);
      });
    });

    it('should emit an inline web console event for a started vnc node', () => {
      const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
      const node = { ...mockNode, status: 'started', console_type: 'vnc', console: 5900 };

      component.openConsole(node);

      expect(emitSpy).toHaveBeenCalledWith({ node, controller: mockController, project: mockProject });
      expect(mockNodeConsoleService.openConsoleForNode).not.toHaveBeenCalled();
    });

    it('should not open a vnc console for a stopped node', () => {
      const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
      component.openConsole({ ...mockNode, status: 'stopped', console_type: 'vnc' });

      expect(mockToasterService.error).toHaveBeenCalledWith('To open console please start the node');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit an inline web console event for an http console node', () => {
      const emitSpy = vi.spyOn(component.openWebConsoleInline, 'emit');
      const node = {
        ...mockNode,
        status: 'started',
        console_type: 'https',
        console_host: '192.168.1.50',
        console: 8443,
      };

      component.openConsole(node);

      expect(emitSpy).toHaveBeenCalledWith({ node, controller: mockController, project: mockProject });
      expect(mockNodeConsoleService.openConsoleForNode).not.toHaveBeenCalled();
    });

    it('should ignore empty packet-filter arrays', () => {
      mockLinksDataSource.getItems.mockReturnValue([
        { ...mockLink, filters: { bpf: [], corrupt: [], packet_loss: [], frequency_drop: [] } },
      ]);

      expect(component.checkPacketFilters([mockNode])).toEqual([]);
    });

  });

  describe('Zoneless Change Detection', () => {
    it('should update nodes correctly after async operation', () => {
      mockComputeService.getComputes.mockReturnValue(of([]));

      component.ngOnInit();
      nodesSubject.next([mockNode]);

      // Verify that the component state is updated correctly
      expect(component.nodes[0].console_host).toBe(mockController.host);
      expect(component.filteredNodes[0].console_host).toBe(mockController.host);
    });

    it('should update computes after async operation', async () => {
      const mockComputes = [{ compute_id: 'comp1', name: 'Local' } as Compute];
      mockComputeService.getComputes.mockReturnValue(of(mockComputes));

      component.ngOnInit();
      await vi.runAllTimersAsync();

      // Verify that the component state is updated correctly
      expect(component.computes).toEqual(mockComputes);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('getComputes', () => {
      it('should show error toaster when getComputes fails with error.error.message', async () => {
        mockComputeService.getComputes.mockReturnValue(
          throwError(() => ({ error: { message: 'Computes failed' } }))
        );

        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Computes failed');
      });

      it('should use fallback message when getComputes error has no message', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({})));

        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load computes');
      });

      it('should call markForCheck when getComputes fails', async () => {
        mockComputeService.getComputes.mockReturnValue(
          throwError(() => ({ error: { message: 'Computes failed' } }))
        );

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(cdrSpy).toHaveBeenCalled();
      });
    });
  });
});
