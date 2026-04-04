import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { ConfiguratorDialogIosComponent } from './configurator-ios.component';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogIosComponent', () => {
  let component: ConfiguratorDialogIosComponent;
  let fixture: ComponentFixture<ConfiguratorDialogIosComponent>;

  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockConfigurationService: any;
  let mockController: Controller;
  let mockNode: Node;
  let nodeSubject: Subject<Node>;

  const createMockProperties = (): Properties => ({
    adapter_type: '',
    adapters: 0,
    ethernet_adapters: 0,
    serial_adapters: 0,
    headless: false,
    linked_clone: false,
    on_close: '',
    aux: 0,
    aux_type: '',
    ram: 256,
    system_id: '',
    nvram: 256,
    image: 'c7200-image.bin',
    usage: '',
    use_any_adapter: false,
    vmname: '',
    ports_mapping: [],
    mappings: {},
    bios_image: '',
    boot_priority: '',
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
    hdd_disk_image_md5sum: '',
    hdd_disk_interface: '',
    initrd: '',
    kernel_command_line: '',
    kernel_image: '',
    mac_address: '',
    mac_addr: '',
    options: '',
    platform: 'c7200',
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
    chassis: '',
    midplane: 'std',
    npe: 'npe-400',
    slot0: '',
    slot1: 'PA-FE-TX',
    slot2: '',
    slot3: '',
    slot4: '',
    slot5: '',
    slot6: '',
    wic0: '',
    wic1: '',
    wic2: '',
  });

  beforeEach(async () => {
    nodeSubject = new Subject<Node>();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(nodeSubject.asObservable()),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getNPETypes: vi.fn().mockReturnValue(['npe-100', 'npe-400']),
      getMidplaneTypes: vi.fn().mockReturnValue(['std', 'vxr']),
      getAdapterMatrix: vi.fn().mockReturnValue({
        c7200: {
          '': {
            0: ['C7200-IO-FE'],
            1: ['PA-A1', 'PA-FE-TX'],
            2: ['PA-FE-TX'],
            3: [],
            4: [],
            5: [],
            6: [],
          },
        },
      }),
      getWicMatrix: vi.fn().mockReturnValue({
        c7200: { 0: ['WIC-1T'], 1: ['WIC-1T'], 2: ['WIC-1T'] },
      }),
      getMacAddrRegex: vi.fn().mockReturnValue(/^([0-9a-fA-F]{4}\.){2}[0-9a-fA-F]{4}$|^$/),
      getIdlepcRegex: vi.fn().mockReturnValue(/^(0x[0-9a-fA-F]+)?$|^$/),
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
    };

    mockNode = {
      node_id: 'node1',
      name: 'R1',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'iosv',
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
      console: 23,
      console_auto_start: false,
      console_type: 'telnet',
      locked: false,
      node_directory: '',
      ports: [],
      tags: [],
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogIosComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: IosConfigurationService, useValue: mockConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogIosComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create form groups in constructor', () => {
      expect(component.generalSettingsForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.memoryForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.advancedSettingsForm).toBeInstanceOf(UntypedFormGroup);
    });

    it('should require name and path fields in generalSettingsForm', () => {
      const nameCtrl = component.generalSettingsForm.get('name');
      const pathCtrl = component.generalSettingsForm.get('path');
      expect(nameCtrl?.hasError('required')).toBe(true);
      expect(pathCtrl?.hasError('required')).toBe(true);
    });

    it('should require ram and nvram fields in memoryForm', () => {
      const ramCtrl = component.memoryForm.get('ram');
      const nvramCtrl = component.memoryForm.get('nvram');
      expect(ramCtrl?.hasError('required')).toBe(true);
      expect(nvramCtrl?.hasError('required')).toBe(true);
    });

    it('should have separatorKeysCodes for chip input', () => {
      expect(component.separatorKeysCodes).toBeDefined();
      expect(Array.isArray(component.separatorKeysCodes)).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should call getConfiguration and fillSlotsData after node loads', () => {
      const getConfigSpy = vi.spyOn(component, 'getConfiguration');
      const fillSlotsSpy = vi.spyOn(component, 'fillSlotsData');

      fixture.detectChanges();
      nodeSubject.next(mockNode);

      expect(getConfigSpy).toHaveBeenCalled();
      expect(fillSlotsSpy).toHaveBeenCalled();
    });

    it('should populate forms with node data after node loads', () => {
      fixture.detectChanges();
      nodeSubject.next(mockNode);
      fixture.detectChanges();

      expect(component.generalSettingsForm.get('name')?.value).toBe('R1');
      expect(component.generalSettingsForm.get('path')?.value).toBe('c7200-image.bin');
      expect(component.generalSettingsForm.get('console_type')?.value).toBe('telnet');
      expect(component.generalSettingsForm.get('slot1')?.value).toBe('PA-FE-TX');
    });

    it('should initialize empty tags array when node has no tags', () => {
      mockNode.tags = undefined;
      fixture.detectChanges();
      nodeSubject.next(mockNode);
      fixture.detectChanges();

      expect(component.node.tags).toEqual([]);
    });
  });

  describe('getConfiguration', () => {
    it('should populate consoleTypes, NPETypes, MidplaneTypes, adapterMatrix, wicMatrix', () => {
      component.getConfiguration();

      expect(component.consoleTypes).toEqual(['telnet', 'none']);
      expect(component.NPETypes).toEqual(['npe-100', 'npe-400']);
      expect(component.MidplaneTypes).toEqual(['std', 'vxr']);
      expect(component.adapterMatrix).toBeDefined();
      expect(component.wicMatrix).toBeDefined();
    });
  });

  describe('fillSlotsData', () => {
    it('should be a no-op for compatibility', () => {
      expect(() => component.fillSlotsData()).not.toThrow();
    });
  });

  describe('saveSlotsData', () => {
    it('should save slot values to node properties when adapters exist for platform', () => {
      component.node = mockNode;
      component.adapterMatrix = mockConfigurationService.getAdapterMatrix();
      component.wicMatrix = mockConfigurationService.getWicMatrix();

      component.generalSettingsForm.patchValue({
        slot0: 'C7200-IO-FE',
        slot1: 'PA-FE-TX',
        wic0: 'WIC-1T',
      });

      component.saveSlotsData();

      expect(component.node.properties.slot0).toBe('C7200-IO-FE');
      expect(component.node.properties.slot1).toBe('PA-FE-TX');
      expect(component.node.properties.wic0).toBe('WIC-1T');
    });

    it('should clear slot properties when no adapters exist for platform/chassis', () => {
      component.node = {
        ...mockNode,
        properties: { ...mockNode.properties, platform: 'c1700', chassis: '1720' },
      };
      component.adapterMatrix = mockConfigurationService.getAdapterMatrix();
      component.wicMatrix = mockConfigurationService.getWicMatrix();

      component.generalSettingsForm.patchValue({ slot0: '', slot1: '' });
      component.saveSlotsData();

      expect(component.node.properties.slot1).toBeUndefined();
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('addTag', () => {
    it('should add a tag to node.tags', () => {
      component.node = mockNode;
      component.node.tags = [];

      const event = { value: 'router', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.node.tags).toContain('router');
    });

    it('should clear the chip input after adding tag', () => {
      component.node = mockNode;
      component.node.tags = [];

      const clearSpy = vi.fn();
      const event = { value: 'router', chipInput: { clear: clearSpy } } as any;
      component.addTag(event);

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should not add empty tags', () => {
      component.node = mockNode;
      component.node.tags = [];

      const event = { value: '', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.node.tags).toEqual([]);
    });

    it('should allow adding duplicate tags (component does not prevent them)', () => {
      component.node = mockNode;
      component.node.tags = ['router'];

      const event = { value: 'router', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.node.tags).toEqual(['router', 'router']);
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from node.tags', () => {
      component.node = mockNode;
      component.node.tags = ['router', 'switch'];

      component.removeTag('router');

      expect(component.node.tags).not.toContain('router');
      expect(component.node.tags).toContain('switch');
    });

    it('should do nothing when tag does not exist', () => {
      component.node = mockNode;
      component.node.tags = ['switch'];

      component.removeTag('router');

      expect(component.node.tags).toEqual(['switch']);
    });

    it('should do nothing when node has no tags', () => {
      component.node = { ...mockNode, tags: undefined };

      expect(() => component.removeTag('router')).not.toThrow();
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
      nodeSubject.next(mockNode);
      fixture.detectChanges();
    });

    it('should show error toast when forms are invalid', () => {
      component.generalSettingsForm.patchValue({ name: '', path: '' });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should update node, show success toast, and close dialog when forms are valid', () => {
      component.generalSettingsForm.patchValue({
        name: 'R1-updated',
        path: 'new-image.bin',
        midplane: 'vxr',
        npe: 'npe-400',
        console_type: 'none',
        aux_type: 'telnet',
        console_auto_start: true,
      });
      component.memoryForm.patchValue({
        ram: 512,
        nvram: 512,
        iomem: 10,
        disk0: 256,
        disk1: 256,
        auto_delete_disks: true,
      });
      component.advancedSettingsForm.patchValue({
        system_id: 'SYS001',
        mac_addr: '',
        idlepc: '0x1234',
        idlemax: 300,
        idlesleep: 250,
        exec_area: 64,
        mmap: true,
        sparsemem: false,
        usage: 'test usage',
      });

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
      expect(mockToasterService.success).toHaveBeenCalledWith('Node R1-updated updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should merge general settings into node properties on save', () => {
      component.generalSettingsForm.patchValue({
        name: 'NewName',
        path: 'new-path.bin',
        midplane: 'vxr',
        npe: 'npe-300',
        console_type: 'none',
        aux_type: 'telnet',
        console_auto_start: true,
      });

      component.onSaveClick();

      expect(component.node.name).toBe('NewName');
      expect(component.node.properties.image).toBe('new-path.bin');
      expect(component.node.properties.midplane).toBe('vxr');
      expect(component.node.properties.npe).toBe('npe-300');
      expect(component.node.console_type).toBe('none');
      expect(component.node.properties.aux_type).toBe('telnet');
      expect(component.node.console_auto_start).toBe(true);
    });

    it('should merge memory settings into node properties on save', () => {
      component.memoryForm.patchValue({
        ram: 1024,
        nvram: 512,
        iomem: 15,
        disk0: 512,
        disk1: 0,
        auto_delete_disks: false,
      });

      component.onSaveClick();

      expect(component.node.properties.ram).toBe(1024);
      expect(component.node.properties.nvram).toBe(512);
      expect(component.node.properties.iomem).toBe(15);
      expect(component.node.properties.disk0).toBe(512);
      expect(component.node.properties.disk1).toBe(0);
      expect(component.node.properties.auto_delete_disks).toBe(false);
    });

    it('should merge advanced settings into node properties on save', () => {
      component.advancedSettingsForm.patchValue({
        system_id: 'SYS123',
        mac_addr: '0011.2233.4455',
        idlepc: '0xdeadbeef',
        idlemax: 500,
        idlesleep: 300,
        exec_area: 128,
        mmap: true,
        sparsemem: true,
        usage: 'Busy Router',
      });

      component.onSaveClick();

      expect(component.node.properties.system_id).toBe('SYS123');
      expect(component.node.properties.mac_addr).toBe('0011.2233.4455');
      expect(component.node.properties.idlepc).toBe('0xdeadbeef');
      expect(component.node.properties.idlemax).toBe(500);
      expect(component.node.properties.idlesleep).toBe(300);
      expect(component.node.properties.exec_area).toBe(128);
      expect(component.node.properties.mmap).toBe(true);
      expect(component.node.properties.sparsemem).toBe(true);
      expect(component.node.properties.usage).toBe('Busy Router');
    });

    it('should call saveSlotsData when saving', () => {
      const saveSlotsSpy = vi.spyOn(component, 'saveSlotsData');

      component.onSaveClick();

      expect(saveSlotsSpy).toHaveBeenCalled();
    });
  });
});
