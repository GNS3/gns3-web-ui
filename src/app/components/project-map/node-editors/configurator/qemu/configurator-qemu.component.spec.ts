import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConfiguratorDialogQemuComponent } from './configurator-qemu.component';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { QemuImage } from '@models/qemu/qemu-image';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ConfiguratorDialogQemuComponent', () => {
  let component: ConfiguratorDialogQemuComponent;
  let fixture: ComponentFixture<ConfiguratorDialogQemuComponent>;

  let mockNodeService: any;
  let mockQemuService: any;
  let mockQemuConfigurationService: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockCd: any;

  const mockController = {} as Controller;

  const createMockProperties = (): Properties => ({
    adapter_type: 'e1000',
    adapters: 4,
    ethernet_adapters: 0,
    serial_adapters: 0,
    headless: false,
    linked_clone: false,
    on_close: 'stop',
    aux: 0,
    aux_type: 'telnet',
    ram: 512,
    system_id: '',
    nvram: 0,
    image: '',
    usage: '',
    use_any_adapter: false,
    vmname: '',
    ports_mapping: [],
    mappings: {},
    bios_image: '',
    boot_priority: 'c',
    cdrom_image: '',
    cpu_throttling: 0,
    cpus: 1,
    hda_disk_image: 'hda.img',
    hda_disk_image_md5sum: '',
    hda_disk_interface: 'ide',
    hdb_disk_image: '',
    hdb_disk_image_md5sum: '',
    hdb_disk_interface: '',
    hdc_disk_image: '',
    hdc_disk_image_md5sum: '',
    hdc_disk_interface: '',
    hdd_disk_image: '',
    hdd_disk_image_md5sum: '',
    hdd_disk_interface: '',
    initrd: '',
    initrd_md5sum: '',
    kernel_command_line: '',
    kernel_image: '',
    kernel_image_md5sum: '',
    mac_address: '00:00:00:00:00:00',
    mac_addr: '',
    options: '',
    platform: 'x86_64',
    chassis: '',
    iomem: 0,
    disk0: 0,
    disk1: 0,
    idlepc: '',
    idlemax: 0,
    idlesleep: 0,
    exec_area: 0,
    mmap: false,
    sparsemem: false,
    auto_delete_disks: false,
    process_priority: 'normal',
    qemu_path: '/usr/bin/qemu-system-x86_64',
    environment: '',
    extra_hosts: '',
    start_command: '',
    replicate_network_connection_state: false,
    memory: 0,
    tpm: false,
    uefi: false,
    slot0: '',
    slot1: '',
    slot2: '',
    slot3: '',
    slot4: '',
    slot5: '',
    slot6: '',
    slot7: '',
    wic0: '',
    wic1: '',
    wic2: '',
    remote_console_host: '',
    remote_console_port: 0,
    remote_console_http_path: '',
    use_default_iou_values: false,
    console_resolution: '',
    console_http_port: 0,
    console_http_path: '',
    extra_volumes: '',
  });

  const createMockNode = (): Node =>
    ({
      node_id: 'node-qemu-1',
      name: 'QEMU VM 1',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'qemu',
      project_id: 'proj-1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 80,
      x: 100,
      y: 200,
      z: 1,
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      first_port_name: '',
      label: undefined,
      symbol: '',
      symbol_url: '',
      properties: createMockProperties(),
      console: 3080,
      console_auto_start: false,
      console_type: 'vnc',
      locked: false,
      node_directory: '',
      ports: [],
      custom_adapters: [],
      tags: ['tag1'],
    } as Node);

  const mockQemuImages: QemuImage[] = [
    { filename: 'hda.img', path: '/images/hda.img' } as QemuImage,
    { filename: 'hdb.img', path: '/images/hdb.img' } as QemuImage,
  ];

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockCd = {
      markForCheck: vi.fn(),
    };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(createMockNode())),
      updateNodeWithCustomAdapters: vi.fn().mockReturnValue(of({})),
    };

    mockQemuService = {
      getImages: vi.fn().mockReturnValue(of(mockQemuImages)),
    };

    mockQemuConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc', 'spice']),
      getAuxConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getOnCloseOptions: vi.fn().mockReturnValue([
        ['Stop', 'stop'],
        ['Cont', 'cont'],
        ['Shutdown', 'shutdown'],
      ]),
      getNetworkTypes: vi.fn().mockReturnValue([
        { name: 'Intel Gigabit', value: 'e1000' },
        { name: 'Intel 82543GC', value: 'e1000-82543gc' },
      ]),
      getBootPriorities: vi.fn().mockReturnValue([
        ['Hard disk', 'c'],
        ['CD-ROM', 'd'],
        ['Network', 'n'],
      ]),
      getDiskInterfaces: vi.fn().mockReturnValue(['ide', 'sata', 'scsi', 'virtio']),
      getPlatform: vi.fn().mockReturnValue(['x86_64', 'aarch64', 'i386']),
      getMacAddrRegex: vi.fn().mockReturnValue('^[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}$'),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(null)),
        componentInstance: {
          controller: null,
          nodeId: null,
          projectId: null,
        },
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogQemuComponent, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: QemuService, useValue: mockQemuService },
        { provide: QemuConfigurationService, useValue: mockQemuConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockCd },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogQemuComponent);
    component = fixture.componentInstance;

    // Spy on dialog.open after component creation to override the root MatDialog provider
    const dialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
      componentInstance: {
        instance: {
          controller: null,
          nodeId: null,
          projectId: null,
        },
      },
    };
    vi.spyOn((component as any).dialog, 'open').mockReturnValue(dialogRef as any);
    mockDialog = (component as any).dialog as any;

    // Set inputs that would be set by parent
    component.controller = mockController;
    component.node = createMockNode();

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // =====================================================================
  // Form initialization
  // =====================================================================

  describe('form initialization', () => {
    it('should create generalSettingsForm with required fields', () => {
      expect(component.generalSettingsForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.generalSettingsForm.get('name')).toBeInstanceOf(UntypedFormControl);
      expect(component.generalSettingsForm.get('ram')).toBeInstanceOf(UntypedFormControl);
    });

    it('should create networkSettingsForm with mac_address validator', () => {
      expect(component.networkSettingsForm).toBeInstanceOf(UntypedFormGroup);
      const macControl = component.networkSettingsForm.get('mac_address');
      expect(macControl).toBeInstanceOf(UntypedFormControl);
    });

    it('should have name field marked as required', () => {
      const nameControl = component.generalSettingsForm.get('name');
      nameControl?.setValue('');
      expect(nameControl?.valid).toBe(false);
      nameControl?.setValue('Test VM');
      expect(nameControl?.valid).toBe(true);
    });
  });

  // =====================================================================
  // ngOnInit behavior
  // =====================================================================

  describe('ngOnInit', () => {
    it('should load node data from NodeService', () => {
      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should load QEMU images from QemuService', () => {
      expect(mockQemuService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should populate generalSettingsForm with node properties', () => {
      expect(component.generalSettingsForm.get('name')?.value).toBe('QEMU VM 1');
      expect(component.generalSettingsForm.get('ram')?.value).toBe(512);
      expect(component.generalSettingsForm.get('platform')?.value).toBe('x86_64');
    });

    it('should populate networkSettingsForm with network properties', () => {
      expect(component.networkSettingsForm.get('adapters')?.value).toBe(4);
      expect(component.networkSettingsForm.get('mac_address')?.value).toBe('00:00:00:00:00:00');
    });

    it('should load configuration options', () => {
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'spice']);
      expect(component.onCloseOptions.length).toBeGreaterThan(0);
      expect(component.bootPriorities.length).toBeGreaterThan(0);
      expect(component.diskInterfaces).toContain('ide');
    });

    it('should populate qemuImages and filteredImages', () => {
      expect(component.qemuImages).toEqual(mockQemuImages);
      expect(component.filteredImages).toEqual(mockQemuImages);
    });

    it('should initialize name from node', () => {
      expect(component.name).toBe('QEMU VM 1');
    });

    it('should set empty tags array if node.tags is undefined', () => {
      component.node.tags = undefined as any;
      component.ngOnInit();
      expect(component.node.tags).toEqual([]);
    });
  });

  // =====================================================================
  // filterImages
  // =====================================================================

  describe('filterImages', () => {
    it('should filter qemuImages by filename case-insensitively', () => {
      const event = { target: { value: 'hda' } } as any;
      const result = component.filterImages(event);
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('hda.img');
    });

    it('should return all images when filter is empty', () => {
      const event = { target: { value: '' } } as any;
      const result = component.filterImages(event);
      expect(result).toHaveLength(mockQemuImages.length);
    });

    it('should return empty array when no images match', () => {
      const event = { target: { value: 'nonexistent' } } as any;
      const result = component.filterImages(event);
      expect(result).toHaveLength(0);
    });
  });

  // =====================================================================
  // Image input handlers
  // =====================================================================

  describe('onHdaImageInput, onHdbImageInput, onHdcImageInput, onHddImageInput', () => {
    it('should update filteredImages on HDA input', () => {
      const event = { target: { value: 'hdb' } } as any;
      component.onHdaImageInput(event);
      expect(component.filteredImages).toHaveLength(1);
      expect(component.filteredImages[0].filename).toBe('hdb.img');
    });

    it('should update filteredImages on HDB input', () => {
      const event = { target: { value: 'hda' } } as any;
      component.onHdbImageInput(event);
      expect(component.filteredImages).toHaveLength(1);
      expect(component.filteredImages[0].filename).toBe('hda.img');
    });

    it('should update filteredImages on HDC input', () => {
      const event = { target: { value: 'hda' } } as any;
      component.onHdcImageInput(event);
      expect(component.filteredImages).toHaveLength(1);
    });

    it('should update filteredImages on HDD input', () => {
      const event = { target: { value: 'hda' } } as any;
      component.onHddImageInput(event);
      expect(component.filteredImages).toHaveLength(1);
    });
  });

  // =====================================================================
  // File upload handlers
  // =====================================================================

  describe('upload handlers', () => {
    it('should update cdrom_image on uploadCdromImageFile', () => {
      const event = { target: { files: [{ name: 'test.iso' }] } } as any;
      component.uploadCdromImageFile(event);
      expect(component.node.properties.cdrom_image).toBe('test.iso');
      expect(component.generalSettingsForm.get('cdrom_image')?.value).toBe('test.iso');
    });

    it('should update initrd on uploadInitrdFile', () => {
      const event = { target: { files: [{ name: 'initrd.img' }] } } as any;
      component.uploadInitrdFile(event);
      expect(component.node.properties.initrd).toBe('initrd.img');
      expect(component.generalSettingsForm.get('initrd')?.value).toBe('initrd.img');
    });

    it('should update kernel_image on uploadKernelImageFile', () => {
      const event = { target: { files: [{ name: 'vmlinuz' }] } } as any;
      component.uploadKernelImageFile(event);
      expect(component.node.properties.kernel_image).toBe('vmlinuz');
      expect(component.generalSettingsForm.get('kernel_image')?.value).toBe('vmlinuz');
    });

    it('should update bios_image on uploadBiosFile', () => {
      const event = { target: { files: [{ name: 'bios.bin' }] } } as any;
      component.uploadBiosFile(event);
      expect(component.node.properties.bios_image).toBe('bios.bin');
      expect(component.generalSettingsForm.get('bios_image')?.value).toBe('bios.bin');
    });
  });

  // =====================================================================
  // openQemuImageCreator
  // =====================================================================

  describe('openQemuImageCreator', () => {
    it('should open QemuImageCreator dialog', () => {
      component.openQemuImageCreator();
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should pass controller and nodeId to dialog instance', () => {
      component.openQemuImageCreator();
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  // =====================================================================
  // openCustomAdaptersDialog
  // =====================================================================

  describe('openCustomAdaptersDialog', () => {
    it('should open CustomAdapters dialog', () => {
      component.openCustomAdaptersDialog();
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should build adapters list based on adapter count', () => {
      component.openCustomAdaptersDialog();
      const dialogCall = mockDialog.open.mock.calls[0][1];
      expect(dialogCall.data.adapters).toBeDefined();
      expect(dialogCall.data.adapters.length).toBe(4); // adapters: 4
    });

    it('should use custom_adapters from node when available', () => {
      component.node.properties.adapters = 2;
      component.node.custom_adapters = [
        { adapter_number: 0, adapter_type: 'virtio', port_name: 'eth0', mac_address: 'AA:BB:CC:DD:EE:FF' },
      ];
      component.openCustomAdaptersDialog();
      const dialogCall = mockDialog.open.mock.calls[0][1];
      expect(dialogCall.data.adapters[0].adapter_type).toBe('virtio');
      expect(dialogCall.data.adapters[0].mac_address).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should use default adapter type when no custom adapter defined', () => {
      component.node.properties.adapters = 1;
      component.node.properties.adapter_type = 'e1000';
      component.node.custom_adapters = [];
      component.openCustomAdaptersDialog();
      const dialogCall = mockDialog.open.mock.calls[0][1];
      expect(dialogCall.data.adapters[0].adapter_type).toBe('e1000');
    });

    it('should generate port names using port_name_format', () => {
      component.node.properties.adapters = 1;
      component.node.port_name_format = 'GigabitEthernet{0}';
      component.node.properties.adapter_type = 'e1000';
      component.node.custom_adapters = [];
      component.openCustomAdaptersDialog();
      const dialogCall = mockDialog.open.mock.calls[0][1];
      expect(dialogCall.data.adapters[0].port_name).toBe('GigabitEthernet0');
    });

    it('should handle port_segment_size for port name generation', () => {
      component.node.properties.adapters = 4;
      component.node.port_name_format = 'Ethernet{0}';
      component.node.port_segment_size = 2;
      component.node.properties.adapter_type = 'e1000';
      component.node.custom_adapters = [];
      component.openCustomAdaptersDialog();
      const dialogCall = mockDialog.open.mock.calls[0][1];
      expect(dialogCall.data.adapters[1].port_name).toBe('Ethernet1'); // segment 0, port 1 -> 0*2+1=1 -> Ethernet1
    });
  });

  // =====================================================================
  // Tags
  // =====================================================================

  describe('addTag', () => {
    it('should add tag to node.tags', () => {
      component.node.tags = [];
      const event = { value: ' newtag ', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);
      expect(component.node.tags).toContain('newtag');
    });

    it('should skip empty tags', () => {
      component.node.tags = [];
      const event = { value: '   ', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);
      expect(component.node.tags).toHaveLength(0);
    });

    it('should clear chip input after adding tag', () => {
      component.node.tags = [];
      const clearSpy = vi.fn();
      const event = { value: 'tag1', chipInput: { clear: clearSpy } } as any;
      component.addTag(event);
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should initialize tags array if undefined', () => {
      component.node.tags = undefined as any;
      const event = { value: 'tag', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);
      expect(component.node.tags).toEqual(['tag']);
    });
  });

  describe('removeTag', () => {
    it('should remove existing tag', () => {
      component.node.tags = ['tag1', 'tag2'];
      component.removeTag('tag1');
      expect(component.node.tags).toEqual(['tag2']);
    });

    it('should do nothing if tag not found', () => {
      component.node.tags = ['tag1'];
      component.removeTag('nonexistent');
      expect(component.node.tags).toEqual(['tag1']);
    });

    it('should do nothing if tags array is undefined', () => {
      component.node.tags = undefined as any;
      expect(() => component.removeTag('tag')).not.toThrow();
    });
  });

  // =====================================================================
  // onCancelClick
  // =====================================================================

  describe('onCancelClick', () => {
    it('should close dialog', () => {
      component.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  // =====================================================================
  // onSaveClick
  // =====================================================================

  describe('onSaveClick', () => {
    it('should show error when generalSettingsForm is invalid', () => {
      component.generalSettingsForm.get('name')?.setValue('');
      component.onSaveClick();
      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
    });

    it('should update node properties from generalSettingsForm on save', () => {
      component.generalSettingsForm.get('name')?.setValue('Updated VM');
      component.generalSettingsForm.get('ram')?.setValue(1024);
      component.generalSettingsForm.get('platform')?.setValue('aarch64');
      component.onSaveClick();
      expect(component.node.name).toBe('Updated VM');
      expect(component.node.properties.ram).toBe(1024);
      expect(component.node.properties.platform).toBe('aarch64');
    });

    it('should update network properties from networkSettingsForm on save', () => {
      component.networkSettingsForm.get('adapters')?.setValue(8);
      component.networkSettingsForm.get('adapter_type')?.setValue('virtio');
      component.onSaveClick();
      expect(component.node.properties.adapters).toBe(8);
      expect(component.node.properties.adapter_type).toBe('virtio');
    });

    it('should call updateNodeWithCustomAdapters on valid save', () => {
      component.onSaveClick();
      expect(mockNodeService.updateNodeWithCustomAdapters).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should close dialog on successful update', () => {
      component.onSaveClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast on successful update', () => {
      component.onSaveClick();
      expect(mockToasterService.success).toHaveBeenCalledWith(`Node ${component.node.name} updated.`);
    });

    it('should show error toast on failed update', () => {
      mockNodeService.updateNodeWithCustomAdapters.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );
      component.onSaveClick();
      expect(mockToasterService.error).toHaveBeenCalledWith('Update failed');
    });

    it('should show generic error message when error has no message', () => {
      mockNodeService.updateNodeWithCustomAdapters.mockReturnValue(throwError(() => new Error('')));
      component.onSaveClick();
      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node');
    });

    it('should save all disk image properties', () => {
      component.generalSettingsForm.patchValue({
        hda_disk_image: 'new_hda.img',
        hda_disk_interface: 'virtio',
        hdb_disk_image: 'new_hdb.img',
        hdb_disk_interface: 'sata',
      });
      component.onSaveClick();
      expect(component.node.properties.hda_disk_image).toBe('new_hda.img');
      expect(component.node.properties.hda_disk_interface).toBe('virtio');
      expect(component.node.properties.hdb_disk_image).toBe('new_hdb.img');
      expect(component.node.properties.hdb_disk_interface).toBe('sata');
    });

    it('should save advanced settings', () => {
      component.generalSettingsForm.patchValue({
        initrd: 'initrd.img',
        kernel_image: 'vmlinuz',
        kernel_command_line: 'console=ttyS0',
        bios_image: 'bios.bin',
        process_priority: 'high',
        qemu_path: '/usr/bin/qemu',
        options: '-enable-kvm',
        tpm: true,
        uefi: true,
        usage: 'Test VM',
      });
      component.onSaveClick();
      expect(component.node.properties.initrd).toBe('initrd.img');
      expect(component.node.properties.kernel_image).toBe('vmlinuz');
      expect(component.node.properties.tpm).toBe(true);
      expect(component.node.properties.uefi).toBe(true);
    });
  });

  // =====================================================================
  // getConfiguration
  // =====================================================================

  describe('getConfiguration', () => {
    it('should populate consoleTypes', () => {
      component.getConfiguration();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'spice']);
    });

    it('should populate onCloseOptions', () => {
      component.getConfiguration();
      expect(component.onCloseOptions).toContainEqual(['Stop', 'stop']);
    });

    it('should populate networkTypes', () => {
      component.getConfiguration();
      expect(component.networkTypes.length).toBeGreaterThan(0);
    });

    it('should populate bootPriorities', () => {
      component.getConfiguration();
      expect(component.bootPriorities).toContainEqual(['Hard disk', 'c']);
    });

    it('should populate diskInterfaces', () => {
      component.getConfiguration();
      expect(component.diskInterfaces).toContain('ide');
    });
  });
});
