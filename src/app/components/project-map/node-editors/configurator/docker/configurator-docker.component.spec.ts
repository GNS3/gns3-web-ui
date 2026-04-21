import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfiguratorDialogDockerComponent } from './configurator-docker.component';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../../../validators/non-negative-validator';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConfiguratorDialogDockerComponent', () => {
  let fixture: ComponentFixture<ConfiguratorDialogDockerComponent>;
  let component: ConfiguratorDialogDockerComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockNodeService: any;
  let mockToasterService: any;
  let mockDockerConfigurationService: any;
  let mockDialog: any;
  let mockNonNegativeValidator: any;
  let mockChangeDetectorRef: any;

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
    console_resolution: '',
    console_http_port: 0,
    console_http_path: '',
    extra_volumes: '',
  });

  const mockController = { id: 1 } as unknown as Controller;

  const mockNode = {
    node_id: 'docker-1',
    name: 'Docker-1',
    console_type: 'telnet',
    aux_type: '',
    console_auto_start: false,
    properties: createMockProperties(),
    tags: [] as string[],
  } as unknown as Node;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        componentInstance: {},
        close: vi.fn(),
      }),
    };

    mockChangeDetectorRef = { markForCheck: vi.fn() };

    mockNonNegativeValidator = {
      get: null,
    };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue({
        subscribe: vi.fn((cb) => {
          cb(mockNode);
          return { unsubscribe: vi.fn() };
        }),
      }),
      updateNode: vi.fn().mockReturnValue({
        subscribe: vi.fn((observer) => {
          if (observer.next) observer.next();
          return { unsubscribe: vi.fn() };
        }),
      }),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockDockerConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc', 'http']),
      getAuxConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc']),
      getMacAddrRegex: vi.fn().mockReturnValue(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
    };

    await TestBed.configureTestingModule({
      imports: [
        ConfiguratorDialogDockerComponent,
        MatDialogModule,
        MatChipsModule,
        MatCardModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: DockerConfigurationService, useValue: mockDockerConfigurationService },
        { provide: NonNegativeValidator, useValue: mockNonNegativeValidator },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogDockerComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = { ...mockNode } as Node;
    fixture.detectChanges();
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have separatorKeysCodes for chip input', () => {
      expect(component.separatorKeysCodes).toBeDefined();
      expect(Array.isArray(component.separatorKeysCodes)).toBe(true);
    });

    it('should have consoleResolutions array', () => {
      expect(component.consoleResolutions).toBeDefined();
      expect(component.consoleResolutions.length).toBeGreaterThan(0);
    });

    it('should initialize generalSettingsForm with required fields', () => {
      expect(component.generalSettingsForm.get('name')).toBeTruthy();
      expect(component.generalSettingsForm.get('adapter')).toBeTruthy();
      expect(component.generalSettingsForm.get('consoleHttpPort')).toBeTruthy();
      expect(component.generalSettingsForm.get('consoleHttpPath')).toBeTruthy();
    });

    it('should have console_auto_start defaulting to false', () => {
      expect(component.generalSettingsForm.get('console_auto_start')?.value).toBe(false);
    });
  });

  describe('getConfiguration', () => {
    it('should load console types from DockerConfigurationService', () => {
      component.getConfiguration();

      expect(mockDockerConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'http']);
    });

    it('should load aux console types from DockerConfigurationService', () => {
      component.getConfiguration();

      expect(mockDockerConfigurationService.getAuxConsoleTypes).toHaveBeenCalled();
      expect(component.auxConsoleTypes).toEqual(['telnet', 'vnc']);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch node data from NodeService', () => {
      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should update node name from fetched data', () => {
      expect(component.name).toBe(mockNode.name);
    });

    it('should patch form with node properties', () => {
      expect(component.generalSettingsForm.get('name')?.value).toBe(mockNode.name);
    });

    it('should call getConfiguration after loading data', () => {
      expect(mockDockerConfigurationService.getConsoleTypes).toHaveBeenCalled();
    });

    it('should initialize tags array if undefined', () => {
      expect(component.node.tags).toBeDefined();
    });
  });

  describe('addTag', () => {
    it('should add tag to node tags array', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const mockEvent = { value: 'new-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toContain('new-tag');
      expect(mockEvent.chipInput.clear).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const initialTags = [...(component.node.tags || [])];
      const mockEvent = { value: '', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(initialTags);
    });

    it('should initialize tags array if undefined', () => {
      component.node = { ...mockNode, tags: undefined } as any;
      const mockEvent = { value: 'test-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(['test-tag']);
    });

    it('should trim whitespace from tag value', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const mockEvent = { value: '  trimmed-tag  ', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toContain('trimmed-tag');
    });
  });

  describe('removeTag', () => {
    it('should remove tag from node tags array', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2', 'tag3'] } as Node;

      component.removeTag('tag2');

      expect(component.node.tags).not.toContain('tag2');
      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not throw when tags is undefined', () => {
      component.node = { ...mockNode, tags: undefined } as any;

      expect(() => component.removeTag('tag1')).not.toThrow();
    });

    it('should not modify array when tag not found', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2'] } as Node;
      const originalTags = [...component.node.tags];

      component.removeTag('nonexistent');

      expect(component.node.tags).toEqual(originalTags);
    });
  });

  describe('onSaveClick', () => {
    it('should show error toast when form is invalid', () => {
      component.generalSettingsForm.get('name')?.setValue('');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should update node properties when form is valid', () => {
      component.generalSettingsForm.patchValue({
        name: 'Updated-Docker',
        startCommand: '/bin/bash',
        adapter: 2,
        mac_address: '00:00:00:00:00:01',
        memory: 1024,
        cpus: 2,
        console_type: 'vnc',
        aux_type: 'telnet',
        console_auto_start: true,
        console_resolution: '1920x1080',
        consoleHttpPort: '8080',
        consoleHttpPath: '/',
        extra_hosts: 'host1.local',
        extra_volumes: '/data:/data',
        usage: 'Test usage',
      });

      component.onSaveClick();

      expect(component.node.name).toBe('Updated-Docker');
      expect(component.node.properties.start_command).toBe('/bin/bash');
      expect(component.node.properties.adapters).toBe(2);
      expect(component.node.properties.mac_address).toBe('00:00:00:00:00:01');
      expect(component.node.properties.memory).toBe(1024);
      expect(component.node.properties.cpus).toBe(2);
      expect(component.node.console_type).toBe('vnc');
      expect(component.node.aux_type).toBe('telnet');
      expect(component.node.console_auto_start).toBe(true);
      expect(component.node.properties.console_resolution).toBe('1920x1080');
      expect(component.node.properties.console_http_port).toBe('8080');
      expect(component.node.properties.console_http_path).toBe('/');
      expect(component.node.properties.extra_hosts).toBe('host1.local');
      expect(component.node.properties.extra_volumes).toBe('/data:/data');
      expect(component.node.properties.usage).toBe('Test usage');
    });

    it('should call updateNode service with controller and node', () => {
      component.generalSettingsForm.patchValue({
        name: 'Docker-Updated',
        adapter: 1,
        consoleHttpPort: '80',
        consoleHttpPath: '/path',
      });

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should show success toast with node name on successful update', () => {
      component.generalSettingsForm.patchValue({
        name: 'Docker-Saved',
        adapter: 1,
        consoleHttpPort: '80',
        consoleHttpPath: '/path',
      });

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Docker-Saved updated.');
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog without data', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
