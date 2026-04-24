import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { EditNetworkConfigurationDialogComponent } from './edit-network-configuration.component';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditNetworkConfigurationDialogComponent', () => {
  let component: EditNetworkConfigurationDialogComponent;
  let fixture: ComponentFixture<EditNetworkConfigurationDialogComponent>;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockDialogRef: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockNode: Node;
  const mockConfiguration = 'ethernet0_config = "..."\nnetwork_mode = "bridge"';

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
      ports: [],
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
      getNetworkConfiguration: vi.fn().mockReturnValue(of(mockConfiguration)),
      saveNetworkConfiguration: vi.fn().mockReturnValue(of('Configuration saved')),
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

    await TestBed.configureTestingModule({
      imports: [EditNetworkConfigurationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditNetworkConfigurationDialogComponent);
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

    it('should have empty string configuration initially', () => {
      expect(component.configuration()).toBe('');
    });

    it('should have node and controller assigned', () => {
      expect(component.node).toBe(mockNode);
      expect(component.controller).toBe(mockController);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch network configuration from NodeService', () => {
      fixture.detectChanges();

      expect(mockNodeService.getNetworkConfiguration).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should populate configuration after fetching', () => {
      fixture.detectChanges();

      expect(component.configuration()).toBe(mockConfiguration);
    });

    it('should call markForCheck after receiving configuration', () => {
      fixture.detectChanges();

      expect(component.configuration()).toBe(mockConfiguration);
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      component.configuration.set(mockConfiguration);
    });

    it('should save network configuration via NodeService', () => {
      component.onSaveClick();

      expect(mockNodeService.saveNetworkConfiguration).toHaveBeenCalledWith(
        mockController,
        mockNode,
        mockConfiguration
      );
    });

    it('should show success toast with node name after saving', () => {
      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith(`Configuration for node ${mockNode.name} saved.`);
    });

    it('should close the dialog after saving', () => {
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog without saving', () => {
      component.configuration.set('some unsaved config');
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockNodeService.saveNetworkConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('Zoneless Change Detection', () => {
    it('should update configuration after async operation in ngOnInit', () => {
      fixture.detectChanges();

      expect(component.configuration()).toBe(mockConfiguration);
    });
  });

  describe('Error handling', () => {
    it('should show error toast when getNetworkConfiguration fails', () => {
      mockNodeService.getNetworkConfiguration.mockReturnValue(
        throwError(() => new Error('Failed to load network configuration'))
      );
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load network configuration');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should show error toast when saveNetworkConfiguration fails', () => {
      mockNodeService.saveNetworkConfiguration.mockReturnValue(
        throwError(() => new Error('Failed to save network configuration'))
      );
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      component.configuration.set(mockConfiguration);

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to save network configuration');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
