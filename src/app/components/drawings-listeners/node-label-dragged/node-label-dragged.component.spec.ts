import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { NodeLabelDraggedComponent } from './node-label-dragged.component';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodeService } from '@services/node.service';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { Node, Properties } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NodeLabelDraggedComponent', () => {
  let component: NodeLabelDraggedComponent;
  let fixture: ComponentFixture<NodeLabelDraggedComponent>;
  let mockNodesDataSource: any;
  let mockNodeService: any;
  let mockNodesEventSource: any;
  let mockMapLabelToLabel: any;
  let labelDraggedSubject: Subject<DraggedDataEvent<MapLabel>>;
  let mockController: Controller;

  const createMockProperties = (): Properties =>
    ({
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
    } as unknown as Properties);

  const createMockNode = (): Node =>
    ({
      node_id: 'node1',
      name: 'Test Node',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'vpcs',
      project_id: 'proj1',
      command_line: '',
      compute_id: 'compute1',
      height: 50,
      width: 60,
      x: 100,
      y: 200,
      z: 0,
      ports: [],
      properties: createMockProperties(),
      label: { x: 100, y: 200, text: 'Node Label', rotation: 0, style: '' },
    } as unknown as Node);

  const createMockMapLabel = (): MapLabel => ({
    id: 'label1',
    rotation: 0,
    style: '',
    text: 'Node Label',
    x: 100,
    y: 200,
    originalX: 100,
    originalY: 200,
    nodeId: 'node1',
  });

  beforeEach(async () => {
    labelDraggedSubject = new Subject<DraggedDataEvent<MapLabel>>();

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockNodesDataSource = {
      get: vi.fn(),
      update: vi.fn(),
    };

    mockNodeService = {
      updateLabel: vi.fn().mockReturnValue(of(createMockNode())),
    };

    mockNodesEventSource = {
      labelDragged: labelDraggedSubject.asObservable(),
    };

    mockMapLabelToLabel = {
      convert: vi.fn().mockReturnValue({ x: 150, y: 250, text: 'Node Label', rotation: 0, style: '' }),
    };

    await TestBed.configureTestingModule({
      imports: [NodeLabelDraggedComponent],
      providers: [
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: NodeService, useValue: mockNodeService },
        { provide: NodesEventSource, useValue: mockNodesEventSource },
        { provide: MapLabelToLabelConverter, useValue: mockMapLabelToLabel },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeLabelDraggedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('ngOnInit', () => {
    it('should subscribe to labelDragged event', () => {
      const subscribeSpy = vi.spyOn(labelDraggedSubject, 'subscribe');
      component.ngOnInit();
      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe('onNodeLabelDragged', () => {
    it('should retrieve node from data source using nodeId from event', () => {
      const mockNode = createMockNode();
      mockNodesDataSource.get.mockReturnValue(mockNode);

      const mapLabel = createMockMapLabel();
      const draggedEvent = new DraggedDataEvent<MapLabel>(mapLabel, 50, 50);

      component.onNodeLabelDragged(draggedEvent);

      expect(mockNodesDataSource.get).toHaveBeenCalledWith(mapLabel.nodeId);
    });

    it('should update mapLabel x and y with delta values', () => {
      const mockNode = createMockNode();
      mockNodesDataSource.get.mockReturnValue(mockNode);

      const mapLabel = createMockMapLabel();
      const originalX = mapLabel.x;
      const originalY = mapLabel.y;
      const dx = 50;
      const dy = 50;
      const draggedEvent = new DraggedDataEvent<MapLabel>(mapLabel, dx, dy);

      component.onNodeLabelDragged(draggedEvent);

      expect(mapLabel.x).toBe(originalX + dx);
      expect(mapLabel.y).toBe(originalY + dy);
    });

    it('should convert mapLabel to label using converter', () => {
      const mockNode = createMockNode();
      mockNodesDataSource.get.mockReturnValue(mockNode);

      const mapLabel = createMockMapLabel();
      const draggedEvent = new DraggedDataEvent<MapLabel>(mapLabel, 50, 50);

      component.onNodeLabelDragged(draggedEvent);

      expect(mockMapLabelToLabel.convert).toHaveBeenCalledWith(mapLabel);
    });

    it('should update node label with converted label', () => {
      const mockNode = createMockNode();
      mockNodesDataSource.get.mockReturnValue(mockNode);

      const mapLabel = createMockMapLabel();
      const convertedLabel = { x: 150, y: 250, text: 'Updated Label', rotation: 0, style: '' };
      mockMapLabelToLabel.convert.mockReturnValue(convertedLabel);
      const draggedEvent = new DraggedDataEvent<MapLabel>(mapLabel, 50, 50);

      component.onNodeLabelDragged(draggedEvent);

      expect(mockNode.label).toEqual(convertedLabel);
    });

    it('should call nodeService.updateLabel with controller, node and label', () => {
      const mockNode = createMockNode();
      mockNodesDataSource.get.mockReturnValue(mockNode);

      const mapLabel = createMockMapLabel();
      const draggedEvent = new DraggedDataEvent<MapLabel>(mapLabel, 50, 50);

      fixture.componentRef.setInput('controller', mockController);
      component.onNodeLabelDragged(draggedEvent);

      expect(mockNodeService.updateLabel).toHaveBeenCalledWith(mockController, mockNode, mockNode.label);
    });

    it('should update data source with returned node from updateLabel', () => {
      const updatedNode = { ...createMockNode(), name: 'Updated Node' };
      mockNodeService.updateLabel.mockReturnValue(of(updatedNode));
      const mockNode = createMockNode();
      mockNodesDataSource.get.mockReturnValue(mockNode);

      const mapLabel = createMockMapLabel();
      const draggedEvent = new DraggedDataEvent<MapLabel>(mapLabel, 50, 50);

      component.onNodeLabelDragged(draggedEvent);

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(updatedNode);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from labelDragged', () => {
      const subscribeSpy = vi.spyOn(mockNodesEventSource.labelDragged, 'subscribe');

      component.ngOnInit();
      const subscription = subscribeSpy.mock.results[0].value;

      const unsubscribeSpy = vi.spyOn(subscription, 'unsubscribe');
      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
