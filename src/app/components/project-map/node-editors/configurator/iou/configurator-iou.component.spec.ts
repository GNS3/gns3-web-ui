import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ConfiguratorDialogIouComponent } from './configurator-iou.component';
import { IouConfigurationService } from '@services/iou-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogIouComponent', () => {
  let component: ConfiguratorDialogIouComponent;
  let fixture: ComponentFixture<ConfiguratorDialogIouComponent>;
  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockConfigurationService: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockNode: Node;

  const createMockNode = (overrides = {}): Node =>
    ({
      node_id: 'node-1',
      name: 'IOU1',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'iou',
      project_id: 'proj-1',
      command_line: '',
      compute_id: 'local',
      height: 50,
      width: 50,
      x: 100,
      y: 100,
      console: 0,
      console_type: 'telnet',
      console_auto_start: false,
      first_port_name: '',
      label: { text: '', x: 0, y: 0, font_size: 0, color: '' },
      locked: false,
      node_directory: '',
      port_name_format: '',
      port_segment_size: 0,
      properties: {
        ethernet_adapters: 2,
        serial_adapters: 0,
        use_default_iou_values: true,
        ram: '',
        nvram: '',
        usage: '',
        adapter_type: '',
        adapters: 0,
        extra_hosts: '',
        extra_console_args: '',
        aux: 0,
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
        start_command: '',
        replicate_network_connection_state: false,
        memory: 0,
        tpm: false,
        uefi: false,
        on_close: '',
        use_any_adapter: false,
        linked_clone: false,
        headless: false,
        vmname: '',
        ports_mapping: [],
        mappings: {},
      },
      tags: [],
      ...overrides,
    } as unknown as Node);

  beforeEach(async () => {
    vi.clearAllMocks();
    mockController = { project_id: 'proj-1' } as unknown as Controller;
    mockNode = createMockNode();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(mockNode)),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc', 'none']),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        ConfiguratorDialogIouComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatChipsModule,
        MatIconModule,
        MatCheckboxModule,
        MatTabsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: IouConfigurationService, useValue: mockConfigurationService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        UntypedFormBuilder,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogIouComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have separatorKeysCodes with ENTER and COMMA', () => {
      expect(component.separatorKeysCodes).toContain(ENTER);
      expect(component.separatorKeysCodes).toContain(COMMA);
    });

    it('should initialize empty consoleTypes', () => {
      expect(component.consoleTypes).toBeDefined();
      expect(Array.isArray(component.consoleTypes)).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch node data and populate forms', async () => {
      await TestBed.resetTestingModule();
      mockNodeService.getNode.mockReturnValue(of(mockNode));

      await TestBed.configureTestingModule({
        imports: [
          ConfiguratorDialogIouComponent,
          ReactiveFormsModule,
          MatDialogModule,
          MatChipsModule,
          MatIconModule,
          MatCheckboxModule,
          MatTabsModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NodeService, useValue: mockNodeService },
          { provide: ToasterService, useValue: mockToasterService },
          { provide: IouConfigurationService, useValue: mockConfigurationService },
          UntypedFormBuilder,
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(ConfiguratorDialogIouComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.controller = mockController;
      newComponent.node = mockNode;
      newFixture.detectChanges();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should initialize node tags array if undefined', async () => {
      const nodeWithoutTags = createMockNode({ tags: undefined });
      mockNodeService.getNode.mockReturnValue(of(nodeWithoutTags));

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          ConfiguratorDialogIouComponent,
          ReactiveFormsModule,
          MatDialogModule,
          MatChipsModule,
          MatIconModule,
          MatCheckboxModule,
          MatTabsModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NodeService, useValue: mockNodeService },
          { provide: ToasterService, useValue: mockToasterService },
          { provide: IouConfigurationService, useValue: mockConfigurationService },
          UntypedFormBuilder,
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(ConfiguratorDialogIouComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.controller = mockController;
      newComponent.node = nodeWithoutTags;
      newFixture.detectChanges();

      expect(newComponent.node.tags).toEqual([]);
    });
  });

  describe('getConfiguration', () => {
    it('should populate consoleTypes from configurationService', () => {
      component.getConfiguration();
      expect(mockConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'none']);
    });
  });

  describe('onSaveClick', () => {
    it('should update node and close dialog when forms are valid', async () => {
      const updatedNode = createMockNode({ name: 'UpdatedIOU' });
      mockNodeService.getNode.mockReturnValue(of(updatedNode));

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          ConfiguratorDialogIouComponent,
          ReactiveFormsModule,
          MatDialogModule,
          MatChipsModule,
          MatIconModule,
          MatCheckboxModule,
          MatTabsModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NodeService, useValue: mockNodeService },
          { provide: ToasterService, useValue: mockToasterService },
          { provide: IouConfigurationService, useValue: mockConfigurationService },
          UntypedFormBuilder,
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(ConfiguratorDialogIouComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.controller = mockController;
      newComponent.node = updatedNode;
      newFixture.detectChanges();

      newComponent.generalSettingsForm.patchValue({ name: 'UpdatedIOU' });
      newComponent.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalled();
      expect(mockToasterService.success).toHaveBeenCalledWith('Node UpdatedIOU updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toaster when generalSettingsForm is invalid', () => {
      component.generalSettingsForm.get('name')?.setValue('');
      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should show error toaster when networkForm is invalid', () => {
      component.networkForm.get('ethernetAdapters')?.setValue('');
      component.networkForm.get('serialAdapters')?.setValue('');
      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should merge form values into node properties', async () => {
      const updatedNode = createMockNode({
        properties: {
          ethernet_adapters: 4,
          serial_adapters: 2,
          use_default_iou_values: false,
          ram: '256',
          nvram: '64',
          usage: 'test usage',
        },
      });
      mockNodeService.getNode.mockReturnValue(of(updatedNode));

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          ConfiguratorDialogIouComponent,
          ReactiveFormsModule,
          MatDialogModule,
          MatChipsModule,
          MatIconModule,
          MatCheckboxModule,
          MatTabsModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NodeService, useValue: mockNodeService },
          { provide: ToasterService, useValue: mockToasterService },
          { provide: IouConfigurationService, useValue: mockConfigurationService },
          UntypedFormBuilder,
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(ConfiguratorDialogIouComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.controller = mockController;
      newComponent.node = updatedNode;
      newFixture.detectChanges();

      newComponent.generalSettingsForm.patchValue({
        name: 'TestNode',
        console_type: 'vnc',
        console_auto_start: true,
        use_default_iou_values: false,
        ram: '512',
        nvram: '128',
        usage: 'custom usage',
      });
      newComponent.networkForm.patchValue({
        ethernetAdapters: 4,
        serialAdapters: 2,
      });

      newComponent.onSaveClick();

      expect(newComponent.node.properties.ram).toBe('512');
      expect(newComponent.node.properties.nvram).toBe('128');
      expect(newComponent.node.properties.use_default_iou_values).toBe(false);
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('addTag', () => {
    it('should add tag to node.tags', () => {
      const event = {
        value: 'new-tag',
        chipInput: { clear: vi.fn() },
        input: null as unknown as HTMLInputElement,
      } as unknown as MatChipInputEvent;

      component.addTag(event);

      expect(component.node.tags).toContain('new-tag');
      expect(event.chipInput.clear).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      const event = {
        value: '   ',
        chipInput: { clear: vi.fn() },
        input: null as unknown as HTMLInputElement,
      } as unknown as MatChipInputEvent;

      component.addTag(event);

      expect(component.node.tags.length).toBe(0);
    });

    it('should initialize tags array if undefined before adding', () => {
      component.node.tags = undefined;
      const event = {
        value: 'tag1',
        chipInput: { clear: vi.fn() },
        input: null as unknown as HTMLInputElement,
      } as unknown as MatChipInputEvent;

      component.addTag(event);

      expect(component.node.tags).toEqual(['tag1']);
    });
  });

  describe('removeTag', () => {
    it('should remove tag from node.tags', () => {
      component.node.tags = ['tag1', 'tag2', 'tag3'];

      component.removeTag('tag2');

      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not modify tags if tag not found', () => {
      component.node.tags = ['tag1', 'tag2'];

      component.removeTag('nonexistent');

      expect(component.node.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle undefined tags array gracefully', () => {
      component.node.tags = undefined;

      expect(() => component.removeTag('tag')).not.toThrow();
    });
  });

  describe('form validation', () => {
    it('should have required validator on name field', () => {
      const nameControl = component.generalSettingsForm.get('name');
      nameControl?.setValue('');
      expect(nameControl?.valid).toBe(false);
    });

    it('should be valid with name provided', () => {
      const nameControl = component.generalSettingsForm.get('name');
      nameControl?.setValue('ValidName');
      expect(nameControl?.valid).toBe(true);
    });

    it('should have required validator on ethernetAdapters field', () => {
      const ethernetControl = component.networkForm.get('ethernetAdapters');
      ethernetControl?.setValue('');
      expect(ethernetControl?.valid).toBe(false);
    });

    it('should have required validator on serialAdapters field', () => {
      const serialControl = component.networkForm.get('serialAdapters');
      serialControl?.setValue('');
      expect(serialControl?.valid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should show error toast when getNode fails', () => {
      mockNodeService.getNode.mockReturnValue(throwError(() => new Error('Failed to load node')));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load node');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should show error toast when updateNode fails', () => {
      mockNodeService.updateNode.mockReturnValue(throwError(() => new Error('Failed to update node')));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.generalSettingsForm.patchValue({ name: 'IOU1' });
      component.networkForm.patchValue({ ethernetAdapters: 2, serialAdapters: 0 });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
