import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { ConfigureCustomAdaptersDialogComponent, CustomAdapter } from './configure-custom-adapters.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfigureCustomAdaptersDialogComponent', () => {
  let component: ConfigureCustomAdaptersDialogComponent;
  let fixture: ComponentFixture<ConfigureCustomAdaptersDialogComponent>;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockController: Controller;
  let mockNode: Node;

  beforeEach(async () => {
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
      updateNodeWithCustomAdapters: vi.fn().mockReturnValue(of(undefined)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    const mockDockerConfigurationService = {};

    await TestBed.configureTestingModule({
      imports: [ConfigureCustomAdaptersDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: DockerConfigurationService, useValue: mockDockerConfigurationService },
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

    it('should have displayedColumns set correctly', () => {
      expect(component.displayedColumns).toEqual(['adapter_number', 'port_name']);
    });
  });

  describe('ngOnInit behavior via component state', () => {
    it('should have adapter_number assigned sequentially starting from 0 for adapters created from ports', () => {
      // After normal initialization (fixture.detectChanges), adapters from ports should have sequential adapter_numbers
      // The mockNode has no custom_adapters defined at top level (only in properties which is ignored by component)
      // So adapters should be created from ports
      fixture.detectChanges();

      // adapter_number should be assigned sequentially
      expect(component.adapters[0].adapter_number).toBe(0);
      expect(component.adapters[1].adapter_number).toBe(1);
    });

    it('should use existing custom_adapters when node has them defined', () => {
      const existingAdapters: CustomAdapter[] = [
        { adapter_number: 0, port_name: 'eth0' },
        { adapter_number: 1, port_name: 'custom0' },
      ];
      mockNode.custom_adapters = existingAdapters;

      fixture = TestBed.createComponent(ConfigureCustomAdaptersDialogComponent);
      component = fixture.componentInstance;
      component.controller = mockController;
      component.node = mockNode;
      fixture.detectChanges();

      expect(component.adapters).toBe(existingAdapters);
      expect(component.adapters[1].port_name).toBe('custom0');
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should assign adapters to node.custom_adapters', () => {
      component.onSaveClick();

      expect(mockNode.custom_adapters).toBe(component.adapters);
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
});
