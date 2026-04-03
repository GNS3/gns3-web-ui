import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ConfiguratorDialogEthernetHubComponent } from './configurator-ethernet-hub.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';
import { Node, Properties, PortsMapping } from '../../../../../cartography/models/node';
import { Port } from '@models/port';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConfiguratorDialogEthernetHubComponent', () => {
  let fixture: ComponentFixture<ConfiguratorDialogEthernetHubComponent>;
  let component: ConfiguratorDialogEthernetHubComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockNodeService: any;
  let mockToasterService: any;
  let mockVpcsConfigurationService: any;

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
      ports_mapping: [] as PortsMapping[],
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
    }) as Properties;

  const createMockNode = (): Node =>
    ({
      node_id: 'ethernet-hub-1',
      name: 'Ethernet Hub 1',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'ethernet_hub',
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
      ports: [
        { name: 'Ethernet0', port_number: 0, short_name: 'eth0', adapter_number: 0, adapter_type: '', link_type: '' },
        { name: 'Ethernet1', port_number: 1, short_name: 'eth1', adapter_number: 0, adapter_type: '', link_type: '' },
        { name: 'Ethernet2', port_number: 2, short_name: 'eth2', adapter_number: 0, adapter_type: '', link_type: '' },
      ] as Port[],
      tags: ['tag1', 'tag2'],
    }) as Node;

  const mockController = {
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

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(createMockNode())),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockVpcsConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc', 'none']),
      getCategories: vi.fn().mockReturnValue(['category1', 'category2']),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogEthernetHubComponent, MatChipsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: VpcsConfigurationService, useValue: mockVpcsConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogEthernetHubComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = createMockNode();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have separatorKeysCodes for chip input', () => {
      expect(component.separatorKeysCodes).toBeDefined();
      expect(Array.isArray(component.separatorKeysCodes)).toBe(true);
      expect(component.separatorKeysCodes).toContain(13); // ENTER
      expect(component.separatorKeysCodes).toContain(188); // COMMA
    });

    it('should initialize inputForm with required name field', () => {
      expect(component.inputForm.get('name')).toBeTruthy();
      expect(component.inputForm.get('name')?.hasError('required')).toBe(true);
    });

    it('should initialize inputForm with numberOfPorts field', () => {
      expect(component.inputForm.get('numberOfPorts')).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should fetch node from NodeService', () => {
      fixture.detectChanges();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should populate name and numberOfPorts from fetched node', () => {
      fixture.detectChanges();

      expect(component.name).toBe('Ethernet Hub 1');
      expect(component.numberOfPorts).toBe(3);
    });

    it('should patch inputForm with node data', () => {
      fixture.detectChanges();

      expect(component.inputForm.get('name')?.value).toBe('Ethernet Hub 1');
      expect(component.inputForm.get('numberOfPorts')?.value).toBe(3);
    });

    it('should initialize tags array if node has no tags', () => {
      const mockNodeWithNoTags = {
        node_id: 'ethernet-hub-1',
        name: 'Ethernet Hub 1',
        status: 'started',
        console_host: '0.0.0.0',
        node_type: 'ethernet_hub',
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
        tags: undefined,
      } as unknown as Node;

      mockNodeService.getNode.mockReturnValue(of(mockNodeWithNoTags));
      fixture.detectChanges();

      expect(component.node.tags).toEqual([]);
    });

    it('should call getConfiguration', () => {
      const spy = vi.spyOn(component, 'getConfiguration');
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getConfiguration', () => {
    it('should load console types from VpcsConfigurationService', () => {
      component.getConfiguration();

      expect(mockVpcsConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'none']);
    });

    it('should load categories from VpcsConfigurationService', () => {
      component.getConfiguration();

      expect(mockVpcsConfigurationService.getCategories).toHaveBeenCalled();
      expect(component.categories).toEqual(['category1', 'category2']);
    });
  });

  describe('addTag', () => {
    it('should add tag to node tags array', () => {
      component.node = { ...component.node, tags: [] } as Node;
      const mockEvent = { value: 'new-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toContain('new-tag');
      expect(mockEvent.chipInput.clear).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      component.node = { ...component.node, tags: [] } as Node;
      const initialTags = [...(component.node.tags || [])];
      const mockEvent = { value: '', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(initialTags);
    });

    it('should initialize tags array if undefined', () => {
      component.node = { ...component.node, tags: undefined } as any;
      const mockEvent = { value: 'test-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(['test-tag']);
    });

    it('should clear chip input after adding tag', () => {
      component.node = { ...component.node, tags: [] } as Node;
      const mockEvent = { value: 'another-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(mockEvent.chipInput.clear).toHaveBeenCalled();
    });
  });

  describe('removeTag', () => {
    it('should remove tag from node tags array', () => {
      component.node = { ...component.node, tags: ['tag1', 'tag2', 'tag3'] } as Node;

      component.removeTag('tag2');

      expect(component.node.tags).not.toContain('tag2');
      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not throw when tags is undefined', () => {
      component.node = { ...component.node, tags: undefined } as any;

      expect(() => component.removeTag('tag1')).not.toThrow();
    });

    it('should not modify array when tag not found', () => {
      component.node = { ...component.node, tags: ['tag1', 'tag2'] } as Node;
      const originalTags = [...component.node.tags];

      component.removeTag('nonexistent');

      expect(component.node.tags).toEqual(originalTags);
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      component.node = createMockNode();
      component.inputForm.patchValue({
        name: 'Updated Hub Name',
        numberOfPorts: 4,
      });
    });

    it('should update node when form is valid', () => {
      component.onSaveClick();

      expect(component.node.name).toBe('Updated Hub Name');
      expect(component.node.properties.ports_mapping).toBeDefined();
    });

    it('should generate ports_mapping based on numberOfPorts', () => {
      component.inputForm.patchValue({ numberOfPorts: 4 });

      component.onSaveClick();

      expect(component.node.properties.ports_mapping.length).toBe(4);
      expect(component.node.properties.ports_mapping[0]).toEqual({
        name: 'Ethernet0',
        port_number: 0,
      });
      expect(component.node.properties.ports_mapping[3]).toEqual({
        name: 'Ethernet3',
        port_number: 3,
      });
    });

    it('should call NodeService.updateNode with controller and node', () => {
      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should show success toast after successful update', () => {
      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Updated Hub Name updated.');
    });

    it('should close dialog after successful update', () => {
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error when name is empty', () => {
      component.inputForm.patchValue({ name: '' });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should show error when form is invalid', () => {
      component.inputForm.reset();

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
