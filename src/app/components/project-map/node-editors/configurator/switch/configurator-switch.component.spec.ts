import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';
import { ConfiguratorDialogSwitchComponent, NodeMapping } from './configurator-switch.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogSwitchComponent', () => {
  let component: ConfiguratorDialogSwitchComponent;
  let fixture: ComponentFixture<ConfiguratorDialogSwitchComponent>;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockValidationService: any;
  let mockController: Controller;
  let mockNode: Node;

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
    mappings: { '0:1': '0:2', '0:3': '0:4' },
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

  beforeEach(async () => {
    mockNode = {
      node_id: 'switch1',
      name: 'Frame Relay Switch',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'frame_relay_switch',
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

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(mockNode)),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockValidationService = {
      required: vi.fn().mockReturnValue({ isValid: true }),
      validatePort: vi.fn().mockReturnValue({ isValid: true }),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogSwitchComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ValidationService, useValue: mockValidationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogSwitchComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty initial nodeMappingsDataSource', () => {
      expect(component.nodeMappingsDataSource).toEqual([]);
    });

    it('should have correct displayedColumns', () => {
      expect(component.displayedColumns).toEqual(['portIn', 'portOut', 'actions']);
    });

    it('should initialize model signals for all form fields', () => {
      expect(component.nodeName).toBeTruthy();
      expect(component.sourcePort).toBeTruthy();
      expect(component.sourceDlci).toBeTruthy();
      expect(component.destinationPort).toBeTruthy();
      expect(component.destinationDlci).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should fetch node from NodeService', () => {
      fixture.detectChanges();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should populate nodeMappingsDataSource from node properties', () => {
      fixture.detectChanges();

      expect(component.nodeMappingsDataSource.length).toBe(2);
      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '0:1', portOut: '0:2' });
      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '0:3', portOut: '0:4' });
    });

    it('should set name from fetched node', () => {
      fixture.detectChanges();

      expect(component.name).toBe(mockNode.name);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Reset nodeMappingsDataSource to known state
      component.nodeMappingsDataSource = [
        { portIn: '0:1', portOut: '0:2' },
        { portIn: '0:3', portOut: '0:4' },
      ];
    });

    it('should remove element from nodeMappingsDataSource', () => {
      const elementToDelete = component.nodeMappingsDataSource[0];
      const initialLength = component.nodeMappingsDataSource.length;

      component.delete(elementToDelete);

      expect(component.nodeMappingsDataSource.length).toBe(initialLength - 1);
      expect(component.nodeMappingsDataSource).not.toContain(elementToDelete);
    });

    it('should not affect other elements when deleting', () => {
      const elementToDelete = component.nodeMappingsDataSource[0];

      component.delete(elementToDelete);

      expect(component.nodeMappingsDataSource.length).toBe(1);
      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '0:3', portOut: '0:4' });
    });
  });

  describe('add', () => {
    beforeEach(() => {
      // Reset to known state
      component.nodeMappingsDataSource = [
        { portIn: '0:1', portOut: '0:2' },
        { portIn: '0:3', portOut: '0:4' },
      ];
    });

    it('should add new mapping when all fields are filled', () => {
      component.sourcePort.set('1');
      component.sourceDlci.set('10');
      component.destinationPort.set('2');
      component.destinationDlci.set('20');

      component.add();

      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '1:10', portOut: '2:20' });
    });

    it('should show error when mapping already exists', () => {
      component.sourcePort.set('0');
      component.sourceDlci.set('1');
      component.destinationPort.set('0');
      component.destinationDlci.set('2');

      component.add();

      expect(mockToasterService.error).toHaveBeenCalledWith('Mapping already defined.');
    });

    it('should show error when source port is empty', () => {
      mockValidationService.required.mockReturnValueOnce({
        isValid: false,
        errorMessage: 'Source Port is required'
      });
      component.sourcePort.set('');
      component.sourceDlci.set('10');
      component.destinationPort.set('2');
      component.destinationDlci.set('20');

      component.add();

      expect(mockToasterService.error).toHaveBeenCalledWith('Source Port is required');
    });

    it('should clear user input after successful add', () => {
      component.sourcePort.set('3');
      component.sourceDlci.set('30');
      component.destinationPort.set('4');
      component.destinationDlci.set('40');

      component.add();

      expect(component.sourcePort()).toBe('');
      expect(component.sourceDlci()).toBe('');
      expect(component.destinationPort()).toBe('');
      expect(component.destinationDlci()).toBe('');
    });
  });

  describe('clearUserInput', () => {
    it('should reset all input signals to empty values', () => {
      component.sourcePort.set('5');
      component.sourceDlci.set('50');
      component.destinationPort.set('6');
      component.destinationDlci.set('60');

      component.clearUserInput();

      expect(component.sourcePort()).toBe('');
      expect(component.sourceDlci()).toBe('');
      expect(component.destinationPort()).toBe('');
      expect(component.destinationDlci()).toBe('');
    });
  });

  describe('strMapToObj', () => {
    it('should convert Map to object', () => {
      const map = new Map<string, string>();
      map.set('key1', 'value1');
      map.set('key2', 'value2');

      const result = component.strMapToObj(map);

      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should return empty object for empty Map', () => {
      const map = new Map<string, string>();

      const result = component.strMapToObj(map);

      expect(result).toEqual({});
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      mockValidationService.required.mockReturnValue({ isValid: true });
      // Set up valid name signal
      component.nodeName.set('Updated Switch Name');
      component.nodeMappingsDataSource = [
        { portIn: '0:1', portOut: '0:2' },
        { portIn: '0:3', portOut: '0:4' },
      ];
    });

    it('should update node when validation passes', () => {
      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should show success message after successful update', () => {
      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith(`Node ${component.node.name} updated.`);
    });

    it('should close dialog after successful update', () => {
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error when name is empty', () => {
      mockValidationService.required.mockReturnValue({
        isValid: false,
        errorMessage: 'Name is required',
      });
      component.nodeName.set('');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Name is required');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should convert nodeMappingsDataSource to mappings object', () => {
      component.nodeMappingsDataSource = [{ portIn: '5:50', portOut: '6:60' }];

      component.onSaveClick();

      expect(component.node.properties.mappings).toEqual({ '5:50': '6:60' });
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Zoneless Change Detection', () => {
    it('should update nodeMappingsDataSource after async operation', () => {
      fixture.detectChanges();

      expect(component.node).toEqual(mockNode);
      expect(component.nodeMappingsDataSource.length).toBe(2);
    });
  });
});
