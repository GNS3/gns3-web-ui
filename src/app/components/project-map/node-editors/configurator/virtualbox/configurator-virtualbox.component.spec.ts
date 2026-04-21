import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { NodeService } from '@services/node.service';
import { VirtualBoxConfigurationService } from '@services/virtual-box-configuration.service';
import { ConfiguratorDialogVirtualBoxComponent } from './configurator-virtualbox.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogVirtualBoxComponent', () => {
  let fixture: ComponentFixture<ConfiguratorDialogVirtualBoxComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockNodeService: {
    getNode: ReturnType<typeof vi.fn>;
    updateNodeWithCustomAdapters: ReturnType<typeof vi.fn>;
  };
  let mockToasterService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockVirtualBoxConfigurationService: {
    getConsoleTypes: ReturnType<typeof vi.fn>;
    getOnCloseoptions: ReturnType<typeof vi.fn>;
    getNetworkTypes: ReturnType<typeof vi.fn>;
  };

  const mockController = {
    authToken: '',
    id: 1,
    name: 'Local',
    location: 'local' as const,
    host: '127.0.0.1',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:' as const,
    username: '',
    password: '',
  };

  const createMockNode = (): Node => ({
    command_line: '',
    compute_id: 'local',
    console: 5000,
    console_auto_start: false,
    console_host: '127.0.0.1',
    console_type: 'telnet',
    first_port_name: '',
    height: 48,
    label: { rotation: 0, style: '', text: '', x: 0, y: 0 },
    locked: false,
    name: 'TestVM',
    node_directory: '',
    node_id: 'node-1',
    node_type: 'virtualbox',
    port_name_format: 'Ethernet{0}',
    port_segment_size: 0,
    ports: [],
    project_id: 'project-1',
    properties: {
      adapter_type: 'e1000',
      adapters: 1,
      ethernet_adapters: 1,
      serial_adapters: 0,
      headless: false,
      linked_clone: false,
      on_close: 'power_off',
      aux: 0,
      ram: 512,
      system_id: '',
      nvram: 128,
      image: '',
      usage: '',
      use_any_adapter: false,
      vmname: 'TestVM',
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
      hdd_disk_interface: '',
      initrd: '',
      kernel_command_line: '',
      kernel_image: '',
      mac_address: '',
      mac_addr: '',
      options: '',
      platform: '',
      exec_area: 0,
      idlesleep: 30,
      disk0: 0,
      disk1: 0,
      idlepc: '',
      idlemax: 0,
      mmap: true,
      sparsemem: true,
      auto_delete_disks: false,
      process_priority: 'auto',
      qemu_path: '',
      environment: '',
      extra_hosts: '',
      start_command: '',
      replicate_network_connection_state: true,
      memory: 512,
      tpm: false,
      uefi: false,
    },
    status: 'stopped',
    symbol: '',
    symbol_url: '',
    tags: [],
    width: 48,
    x: 100,
    y: 100,
    z: 0,
  });

  const createComponent = (controller: Controller, node: Node) => {
    mockDialogRef = { close: vi.fn() };
    mockNodeService = {
      getNode: vi.fn().mockReturnValue({ subscribe: (fn: (n: Node) => void) => fn(node) }),
      updateNodeWithCustomAdapters: vi.fn().mockReturnValue({ subscribe: () => {} }),
    };
    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockVirtualBoxConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getOnCloseoptions: vi.fn().mockReturnValue([
        ['Power off the VM', 'power_off'],
        ['Send the shutdown signal (ACPI)', 'shutdown_signal'],
        ['Save the VM state', 'save_vm_state'],
      ]),
      getNetworkTypes: vi.fn().mockReturnValue(['Intel PRO/1000 MT Desktop (82540EM)']),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConfiguratorDialogVirtualBoxComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: VirtualBoxConfigurationService, useValue: mockVirtualBoxConfigurationService },
        { provide: MAT_DIALOG_DATA, useValue: { controller, node } },
      ],
    });
    fixture = TestBed.createComponent(ConfiguratorDialogVirtualBoxComponent);
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  describe('component initialization', () => {
    beforeEach(() => createComponent(mockController as Controller, createMockNode()));

    it('should create the component', () => {
      expect(fixture.componentInstance).toBeDefined();
    });

    it('should fetch node data on ngOnInit', () => {
      expect(mockNodeService.getNode).toHaveBeenCalled();
    });

    it('should load configuration values', () => {
      expect(mockVirtualBoxConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(mockVirtualBoxConfigurationService.getOnCloseoptions).toHaveBeenCalled();
      expect(mockVirtualBoxConfigurationService.getNetworkTypes).toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    beforeEach(() => createComponent(mockController as Controller, createMockNode()));

    it('should close the dialog', () => {
      fixture.componentInstance.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => createComponent(mockController as Controller, createMockNode()));

    it('should call updateNodeWithCustomAdapters when form is valid', () => {
      fixture.componentInstance.generalSettingsForm.setValue({
        name: 'UpdatedVM',
        console_type: 'telnet',
        console_auto_start: false,
        ram: '1024',
        on_close: 'power_off',
        headless: true,
        use_any_adapter: false,
        usage: '',
      });

      fixture.componentInstance.onSaveClick();

      expect(mockNodeService.updateNodeWithCustomAdapters).toHaveBeenCalled();
    });

    it('should show success toast and close dialog on successful save', () => {
      (mockNodeService.updateNodeWithCustomAdapters as ReturnType<typeof vi.fn>).mockReturnValue({
        subscribe: (observer: { next?: () => void }) => {
          if (observer.next) observer.next();
        },
      });

      fixture.componentInstance.generalSettingsForm.setValue({
        name: 'UpdatedVM',
        console_type: 'telnet',
        console_auto_start: false,
        ram: '1024',
        on_close: 'power_off',
        headless: true,
        use_any_adapter: false,
        usage: '',
      });

      fixture.componentInstance.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node UpdatedVM updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when form is invalid', () => {
      fixture.componentInstance.generalSettingsForm.setValue({
        name: '',
        console_type: '',
        console_auto_start: false,
        ram: '',
        on_close: '',
        headless: false,
        use_any_adapter: false,
        usage: '',
      });

      fixture.componentInstance.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
    });
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have openCustomAdaptersDialog method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).openCustomAdaptersDialog).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogVirtualBoxComponent.prototype as any).removeTag).toBe('function');
    });
  });
});
