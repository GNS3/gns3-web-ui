import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfiguratorDialogVmwareComponent } from './configurator-vmware.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VmwareConfigurationService } from '@services/vmware-configuration.service';
import { Controller } from '@models/controller';
import { Node, Properties } from '../../../../../cartography/models/node';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { CustomAdaptersComponent } from '@components/preferences/common/custom-adapters/custom-adapters.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogVmwareComponent', () => {
  let component: ConfiguratorDialogVmwareComponent;
  let fixture: ComponentFixture<ConfiguratorDialogVmwareComponent>;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockVmwareConfigurationService: any;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockNode: Node;

  const createMockProperties = (): Properties => ({
    adapter_type: 'e1000',
    adapters: 1,
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

  const createMockNode = (): Node => ({
    node_id: 'node1',
    name: 'Test VMware Node',
    status: 'started',
    console_host: '0.0.0.0',
    node_type: 'vmware',
    project_id: 'proj1',
    command_line: '',
    compute_id: 'compute1',
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
    console: 0,
    console_auto_start: false,
    console_type: 'telnet',
    locked: false,
    node_directory: '',
    ports: [],
    custom_adapters: undefined,
    ethernet_adapters: undefined,
    serial_adapters: undefined,
    tags: [],
  });

  beforeEach(async () => {
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

    mockNode = createMockNode();

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(mockNode)),
      updateNodeWithCustomAdapters: vi.fn().mockReturnValue(of(mockNode)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockVmwareConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getOnCloseoptions: vi.fn().mockReturnValue([
        ['Power off the VM', 'power_off'],
        ['Send the shutdown signal (ACPI)', 'shutdown_signal'],
        ['Save the VM state', 'save_vm_state'],
      ]),
      getNetworkTypes: vi.fn().mockReturnValue(['default', 'e1000', 'e1000e', 'vmxnet', 'vmxnet3']),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(null)),
      }),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogVmwareComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: VmwareConfigurationService, useValue: mockVmwareConfigurationService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogVmwareComponent);
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

    it('should have default initial values', () => {
      expect(component.separatorKeysCodes).toEqual([ENTER, COMMA]);
      expect(component.consoleTypes).toEqual([]);
      expect(component.onCloseOptions).toEqual([]);
      expect(component.networkTypes).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch node data and populate form', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
      expect(component.node).toBeDefined();
      expect(component.name).toBe('Test VMware Node');
    });

    it('should call getConfiguration to load console types and options', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockVmwareConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(mockVmwareConfigurationService.getOnCloseoptions).toHaveBeenCalled();
      expect(mockVmwareConfigurationService.getNetworkTypes).toHaveBeenCalled();
    });

    it('should call markForCheck after loading node data', async () => {
      const markForCheckSpy = vi.spyOn((component as any).cd, 'markForCheck');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('should initialize tags array if node has no tags', async () => {
      const nodeWithoutTags = createMockNode();
      nodeWithoutTags.tags = undefined;
      mockNodeService.getNode.mockReturnValue(of(nodeWithoutTags));

      component.node = nodeWithoutTags;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.node.tags).toEqual([]);
    });
  });

  describe('getConfiguration', () => {
    it('should load console types from vmwareConfigurationService', () => {
      component.getConfiguration();

      expect(component.consoleTypes).toEqual(['telnet', 'none']);
    });

    it('should load on close options from vmwareConfigurationService', () => {
      component.getConfiguration();

      expect(component.onCloseOptions).toEqual([
        ['Power off the VM', 'power_off'],
        ['Send the shutdown signal (ACPI)', 'shutdown_signal'],
        ['Save the VM state', 'save_vm_state'],
      ]);
    });

    it('should load network types from vmwareConfigurationService', () => {
      component.getConfiguration();

      expect(component.networkTypes).toEqual(['default', 'e1000', 'e1000e', 'vmxnet', 'vmxnet3']);
    });
  });

  describe('openCustomAdaptersDialog', () => {
    beforeEach(() => {
      component.getConfiguration();
    });

    it('should populate networkTypes from vmwareConfigurationService', () => {
      expect(component.networkTypes).toEqual(['default', 'e1000', 'e1000e', 'vmxnet', 'vmxnet3']);
    });

    it('should have required adapters from node properties', () => {
      expect(component.node.properties.adapters).toBe(1);
    });
  });

  describe('onSaveClick', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should update node properties when form is valid', () => {
      component.generalSettingsForm.patchValue({
        name: 'Updated Node Name',
        console_type: 'none',
        console_auto_start: true,
        on_close: 'save_vm_state',
        headless: true,
        linked_clone: true,
        use_any_adapter: true,
        usage: 'Test usage',
      });

      component.onSaveClick();

      expect(component.node.name).toBe('Updated Node Name');
      expect(component.node.console_type).toBe('none');
      expect(component.node.console_auto_start).toBe(true);
      expect(component.node.properties.on_close).toBe('save_vm_state');
      expect(component.node.properties.headless).toBe(true);
      expect(component.node.properties.linked_clone).toBe(true);
      expect(component.node.properties.use_any_adapter).toBe(true);
      expect(component.node.properties.usage).toBe('Test usage');
    });

    it('should call updateNodeWithCustomAdapters when form is valid', () => {
      component.onSaveClick();

      expect(mockNodeService.updateNodeWithCustomAdapters).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should close dialog on successful update', () => {
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when form is invalid', () => {
      component.generalSettingsForm.patchValue({
        name: '', // Invalid - required field
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNodeWithCustomAdapters).not.toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('addTag', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add tag to node when value is not empty', () => {
      const event = { value: 'new-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(event);

      expect(component.node.tags).toContain('new-tag');
      expect(event.chipInput.clear).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      const event = { value: '', chipInput: { clear: vi.fn() } } as any;

      component.addTag(event);

      expect(component.node.tags).not.toContain('');
    });

    it('should trim whitespace from tag value', () => {
      const event = { value: '  trimmed-tag  ', chipInput: { clear: vi.fn() } } as any;

      component.addTag(event);

      expect(component.node.tags).toContain('trimmed-tag');
    });

    it('should initialize tags array if undefined', () => {
      component.node.tags = undefined;
      const event = { value: 'test-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(event);

      expect(component.node.tags).toEqual(['test-tag']);
    });

    it('should not call clear if chipInput is null', () => {
      const event = { value: 'test-tag', chipInput: null } as any;

      expect(() => component.addTag(event)).not.toThrow();
    });
  });

  describe('removeTag', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.node.tags = ['tag1', 'tag2', 'tag3'];
    });

    it('should remove tag from node', () => {
      component.removeTag('tag2');

      expect(component.node.tags).not.toContain('tag2');
      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not modify tags if tag not found', () => {
      component.removeTag('non-existent');

      expect(component.node.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle empty tags array', () => {
      component.node.tags = [];

      expect(() => component.removeTag('tag1')).not.toThrow();
    });

    it('should handle undefined tags array', () => {
      component.node.tags = undefined;

      expect(() => component.removeTag('tag1')).not.toThrow();
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have required validator on name field', () => {
      const nameControl = component.generalSettingsForm.get('name');
      nameControl?.setValue('');

      expect(nameControl?.valid).toBe(false);
    });

    it('should accept valid name', () => {
      const nameControl = component.generalSettingsForm.get('name');
      nameControl?.setValue('Valid Name');

      expect(nameControl?.valid).toBe(true);
    });

    it('should have console_auto_start default to false', () => {
      const consoleAutoStartControl = component.generalSettingsForm.get('console_auto_start');

      expect(consoleAutoStartControl?.value).toBe(false);
    });

    it('should have headless default to false', () => {
      const headlessControl = component.generalSettingsForm.get('headless');

      expect(headlessControl?.value).toBe(false);
    });

    it('should have linked_clone default to false', () => {
      const linkedCloneControl = component.generalSettingsForm.get('linked_clone');

      expect(linkedCloneControl?.value).toBe(false);
    });

    it('should have use_any_adapter default to false', () => {
      const useAnyAdapterControl = component.generalSettingsForm.get('use_any_adapter');

      expect(useAnyAdapterControl?.value).toBe(false);
    });
  });
});
