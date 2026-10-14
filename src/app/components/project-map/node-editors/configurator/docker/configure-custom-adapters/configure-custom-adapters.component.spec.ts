import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ConfigureCustomAdaptersDialogComponent } from './configure-custom-adapters.component';
import { ValidationService } from '@services/validation';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfigureCustomAdaptersDialogComponent', () => {
  let component: ConfigureCustomAdaptersDialogComponent;
  let fixture: ComponentFixture<ConfigureCustomAdaptersDialogComponent>;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockNode: Node;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNode = {
      node_id: 'docker1',
      name: 'DockerContainer',
      status: 'started',
      console_host: '0.0.0.0',
      node_type: 'docker',
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
      properties: {
        adapter_type: '',
        adapters: 1,
        ethernet_adapters: 0,
        serial_adapters: 0,
        headless: false,
        linked_clone: false,
        on_close: '',
        aux: 0,
        ram: 512,
        system_id: '',
        nvram: 0,
        image: 'ubuntu:latest',
        usage: '',
        use_any_adapter: false,
        vmname: 'DockerContainer',
        ports_mapping: [],
        mappings: {},
        custom_adapters: undefined,
      },
      console: 0,
      console_auto_start: false,
      console_type: '',
      locked: false,
      node_directory: '',
      ports: [
        { name: 'eth0', short_name: 'eth0' },
        { name: 'eth1', short_name: 'eth1' },
      ],
      ethernet_adapters: undefined,
      serial_adapters: undefined,
    } as unknown as Node;

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
      validateConnectedPorts: vi.fn().mockReturnValue(undefined),
      updateNodeWithCustomAdapters: vi.fn().mockReturnValue(of(undefined)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    const mockValidationService = {
      validateMacAddress: vi.fn().mockReturnValue({ isValid: true }),
    };

    await TestBed.configureTestingModule({
      imports: [ConfigureCustomAdaptersDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ValidationService, useValue: mockValidationService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureCustomAdaptersDialogComponent);
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

    it('should have node and controller assigned', () => {
      expect(component.node).toBe(mockNode);
      expect(component.controller).toBe(mockController);
    });

  });

  describe('ngOnInit behavior via component state', () => {
    it('should have adapter_number assigned sequentially starting from 0 for adapters created from ports', () => {
      // After normal initialization (fixture.detectChanges), adapters from ports should have sequential adapter_numbers
      // The mockNode has no custom_adapters defined at top level (only in properties which is ignored by component)
      // So adapters should be created from ports
      fixture.detectChanges();

      // adapter_number should be assigned sequentially
      expect(component.adapters()[0].adapter_number).toBe(0);
      expect(component.adapters()[1].adapter_number).toBe(1);
    });

    it('should use existing custom_adapters when node has them defined', () => {
      const existingAdapters: any[] = [
        { adapter_number: 0, port_name: 'eth0' },
        { adapter_number: 1, port_name: 'custom0' },
      ];
      mockNode.custom_adapters = existingAdapters;

      fixture = TestBed.createComponent(ConfigureCustomAdaptersDialogComponent);
      component = fixture.componentInstance;
      component.controller = mockController;
      component.node = mockNode;
      fixture.detectChanges();

      expect(component.adapters()[0].adapter_number).toBe(0);
      expect(component.adapters()[0].port_name).toBe('eth0');
      expect(component.adapters()[1].adapter_number).toBe(1);
      expect(component.adapters()[1].port_name).toBe('custom0');
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject invalid changes before invoking the parent save callback', () => {
      component.saveHandler = vi.fn();
      component.validateAdapterCount = vi.fn().mockReturnValue('Cannot remove connected adapter 2, port 0.');
      component.removeAdapter(1);
      component.onSaveClick();

      expect(component.validateAdapterCount).toHaveBeenCalledWith(1);
      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot remove connected adapter 2, port 0.');
      expect(component.saveHandler).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should reject deleting ports 4 and 5 while retaining ports 7 and 8', () => {
      component.saveHandler = vi.fn();
      component.validateAdapterCount = vi.fn().mockReturnValue(undefined);
      for (let i = 2; i < 8; i++) component.addAdapter();
      component.removeAdapter(3);
      component.removeAdapter(4);
      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Only adapters at the end can be removed'));
      expect(component.saveHandler).not.toHaveBeenCalled();
      expect(mockNodeService.updateNodeWithCustomAdapters).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.adapters().map((adapter) => adapter.adapter_number)).toEqual([0, 1, 2, 5, 6, 7]);
    });

    it('should apply removing unused adapters from the end', () => {
      component.saveHandler = vi.fn();
      component.validateAdapterCount = vi.fn().mockReturnValue(undefined);
      component.removeAdapter(1);
      component.onSaveClick();

      expect(component.validateAdapterCount).toHaveBeenCalledWith(1);
      expect(component.saveHandler).toHaveBeenCalledWith(component.adapters());
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should validate standalone node changes before modifying the node', () => {
      mockNodeService.validateConnectedPorts.mockReturnValue('Connected adapter would be removed');
      const properties = { ...mockNode.properties };
      component.onSaveClick();

      expect(mockNode.properties).toEqual(properties);
      expect(mockNode.custom_adapters).toBeUndefined();
      expect(mockNodeService.updateNodeWithCustomAdapters).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should assign adapters and their count to the node', () => {
      component.addAdapter();
      component.onSaveClick();
      expect(mockNode.properties.adapters).toBe(3);
      expect(mockNode.custom_adapters[2].port_name).toBeUndefined();

      expect(mockNode.custom_adapters).toBeDefined();
      expect(mockNode.custom_adapters.length).toBe(component.adapters().length);
    });

    it('should call updateNodeWithCustomAdapters with controller and node', () => {
      component.onSaveClick();

      expect(mockNodeService.updateNodeWithCustomAdapters).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should show success toast with node name after saving', () => {
      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith(`Configuration saved for node ${mockNode.name}`);
    });

    it('should close the dialog after saving', () => {
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not call updateNodeWithCustomAdapters when cancelling', () => {
      fixture.detectChanges();
      component.onCancelClick();

      expect(mockNodeService.updateNodeWithCustomAdapters).not.toHaveBeenCalled();
    });
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfigureCustomAdaptersDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfigureCustomAdaptersDialogComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfigureCustomAdaptersDialogComponent.prototype as any).onCancelClick).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should show error toast when updateNodeWithCustomAdapters fails', () => {
      mockNodeService.updateNodeWithCustomAdapters.mockReturnValue(throwError(() => new Error('Failed to update')));
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
