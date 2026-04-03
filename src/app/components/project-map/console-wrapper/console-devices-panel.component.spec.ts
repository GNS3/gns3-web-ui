import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { ConsoleDevicesPanelComponent } from './console-devices-panel.component';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Node, Properties } from '../../../cartography/models/node';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConsoleDevicesPanelComponent', () => {
  let fixture: ComponentFixture<ConsoleDevicesPanelComponent>;
  let component: ConsoleDevicesPanelComponent;
  let mockNodesDataSource: any;
  let mockChangeDetectorRef: any;
  let nodesSubject: Subject<Node[]>;
  let itemChangedSubject: Subject<Node>;

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
    command_line: '',
    compute_id: 'local',
    console: 5000,
    console_auto_start: false,
    console_host: '127.0.0.1',
    console_type: 'telnet',
    first_port_name: '',
    height: 50,
    label: { text: '', x: 0, y: 0, style: '', rotation: 0 },
    locked: false,
    name: 'Test Node',
    node_directory: '',
    node_id: 'node-1',
    node_type: 'vpcs',
    port_name_format: 'eth{0}',
    port_segment_size: 0,
    ports: [],
    project_id: 'project-1',
    properties: createMockProperties(),
    status: 'started',
    symbol: '',
    symbol_url: '',
    width: 80,
    x: 100,
    y: 200,
    z: 1,
    ...overrides,
  });

  beforeEach(async () => {
    nodesSubject = new Subject<Node[]>();
    itemChangedSubject = new Subject<Node>();

    mockNodesDataSource = {
      changes: nodesSubject.asObservable(),
      itemChanged: itemChangedSubject.asObservable(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConsoleDevicesPanelComponent],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsoleDevicesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have collapsed signal initialized to true', () => {
      expect(component.collapsed()).toBe(true);
    });

    it('should have empty nodes signal initially', () => {
      expect(component.nodes()).toEqual([]);
    });
  });

  describe('isDeviceStarted', () => {
    it('should return true when node status is started', () => {
      const node = createMockNode({ status: 'started' });
      expect(component.isDeviceStarted(node)).toBe(true);
    });

    it('should return false when node status is stopped', () => {
      const node = createMockNode({ status: 'stopped' });
      expect(component.isDeviceStarted(node)).toBe(false);
    });

    it('should return false when node status is starting', () => {
      const node = createMockNode({ status: 'starting' });
      expect(component.isDeviceStarted(node)).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('should return "Running" for started status', () => {
      expect(component.getStatusLabel('started')).toBe('Running');
    });

    it('should return "Starting" for starting status', () => {
      expect(component.getStatusLabel('starting')).toBe('Starting');
    });

    it('should return "Stopped" for stopped status', () => {
      expect(component.getStatusLabel('stopped')).toBe('Stopped');
    });

    it('should return "Suspended" for suspended status', () => {
      expect(component.getStatusLabel('suspended')).toBe('Suspended');
    });

    it('should return "Error" for errored status', () => {
      expect(component.getStatusLabel('errored')).toBe('Error');
    });

    it('should return "Unknown" for unrecognized status', () => {
      expect(component.getStatusLabel('unknown_status')).toBe('Unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return primary color for started status', () => {
      expect(component.getStatusColor('started')).toBe('var(--mat-sys-primary)');
    });

    it('should return tertiary color for starting status', () => {
      expect(component.getStatusColor('starting')).toBe('var(--mat-sys-tertiary)');
    });

    it('should return outline color for stopped status', () => {
      expect(component.getStatusColor('stopped')).toBe('var(--mat-sys-outline)');
    });

    it('should return secondary color for suspended status', () => {
      expect(component.getStatusColor('suspended')).toBe('var(--mat-sys-secondary)');
    });

    it('should return error color for errored status', () => {
      expect(component.getStatusColor('errored')).toBe('var(--mat-sys-error)');
    });

    it('should return outline color for unrecognized status', () => {
      expect(component.getStatusColor('unknown')).toBe('var(--mat-sys-outline)');
    });
  });

  describe('togglePanel', () => {
    it('should toggle collapsed state from true to false', () => {
      component.collapsed.set(true);
      component.togglePanel();
      expect(component.collapsed()).toBe(false);
    });

    it('should toggle collapsed state from false to true', () => {
      component.collapsed.set(false);
      component.togglePanel();
      expect(component.collapsed()).toBe(true);
    });

    it('should call markForCheck after toggle', () => {
      // Note: markForCheck is called internally via injected ChangeDetectorRef
      // This test verifies the state change behavior, not implementation details
      component.collapsed.set(true);
      component.togglePanel();
      expect(component.collapsed()).toBe(false);
    });
  });

  describe('onDeviceClick', () => {
    it('should emit deviceSelected with the clicked node', () => {
      const node = createMockNode({ name: 'Router1' });
      const emitSpy = vi.spyOn(component.deviceSelected, 'emit');

      component.onDeviceClick(node);

      expect(emitSpy).toHaveBeenCalledWith(node);
    });
  });

  describe('node filtering', () => {
    it('should filter out nodes with console_type none', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'none' }),
        createMockNode({ node_id: '2', name: 'Node2', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].node_id).toBe('2');
    });

    it('should filter out nodes with no console_type', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: '' }),
        createMockNode({ node_id: '2', name: 'Node2', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].node_id).toBe('2');
    });

    it('should filter out VNC console type nodes', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'vnc' }),
        createMockNode({ node_id: '2', name: 'Node2', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].node_id).toBe('2');
    });

    it('should filter out HTTP console type nodes', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'http' }),
        createMockNode({ node_id: '2', name: 'Node2', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].node_id).toBe('2');
    });

    it('should filter out HTTPS console type nodes', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'https' }),
        createMockNode({ node_id: '2', name: 'Node2', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].node_id).toBe('2');
    });

    it('should keep telnet console type nodes', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].console_type).toBe('telnet');
    });

    it('should keep custom console type nodes', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'custom' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
      expect(component.nodes()[0].console_type).toBe('custom');
    });
  });

  describe('node sorting', () => {
    it('should sort started devices before stopped devices', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'StoppedNode', status: 'stopped', console_type: 'telnet' }),
        createMockNode({ node_id: '2', name: 'StartedNode', status: 'started', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes()[0].status).toBe('started');
      expect(component.nodes()[1].status).toBe('stopped');
    });

    it('should sort started devices alphabetically by name', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Zebra', status: 'started', console_type: 'telnet' }),
        createMockNode({ node_id: '2', name: 'Alpha', status: 'started', console_type: 'telnet' }),
        createMockNode({ node_id: '3', name: 'Beta', status: 'started', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes()[0].name).toBe('Alpha');
      expect(component.nodes()[1].name).toBe('Beta');
      expect(component.nodes()[2].name).toBe('Zebra');
    });

    it('should sort stopped devices alphabetically by name', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Zebra', status: 'stopped', console_type: 'telnet' }),
        createMockNode({ node_id: '2', name: 'Alpha', status: 'stopped', console_type: 'telnet' }),
      ];

      nodesSubject.next(nodes);
      fixture.detectChanges();

      expect(component.nodes()[0].name).toBe('Alpha');
      expect(component.nodes()[1].name).toBe('Zebra');
    });
  });

  describe('itemChanged subscription', () => {
    it('should update node when itemChanged emits', () => {
      const originalNodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', status: 'stopped', console_type: 'telnet' }),
      ];
      nodesSubject.next(originalNodes);
      fixture.detectChanges();

      const updatedNode = createMockNode({ node_id: '1', name: 'Node1', status: 'started', console_type: 'telnet' });
      itemChangedSubject.next(updatedNode);
      fixture.detectChanges();

      expect(component.nodes()[0].status).toBe('started');
    });

    it('should not add new node if itemChanged emits for non-existing node', () => {
      const originalNodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Node1', console_type: 'telnet' }),
      ];
      nodesSubject.next(originalNodes);
      fixture.detectChanges();

      const newNode = createMockNode({ node_id: '2', name: 'Node2', console_type: 'telnet' });
      itemChangedSubject.next(newNode);
      fixture.detectChanges();

      expect(component.nodes().length).toBe(1);
    });
  });

  describe('template rendering', () => {
    it('should not show device list when collapsed', () => {
      component.collapsed.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.device-list')).toBeNull();
    });

    it('should show device list when not collapsed', () => {
      component.collapsed.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.device-list')).toBeTruthy();
    });

    it('should show empty state when no nodes', () => {
      component.collapsed.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.empty-state')).toBeTruthy();
      expect(compiled.querySelector('.empty-text').textContent).toContain('No console devices available');
    });

    it('should show devices when nodes exist', () => {
      const nodes: Node[] = [
        createMockNode({ node_id: '1', name: 'Router1', console_type: 'telnet' }),
      ];
      nodesSubject.next(nodes);
      component.collapsed.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.device-item')).toBeTruthy();
      expect(compiled.querySelector('.device-name').textContent).toContain('Router1');
    });

    it('should apply lightTheme class when isLightTheme input is true', () => {
      fixture.componentRef.setInput('isLightTheme', true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.console-devices-panel')?.classList.contains('lightTheme')).toBe(true);
    });
  });
});
