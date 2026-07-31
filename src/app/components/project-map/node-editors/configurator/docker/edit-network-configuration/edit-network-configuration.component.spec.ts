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
  const mockConfiguration = `auto eth0
iface eth0 inet dhcp
\thostname DockerContainer
`;

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

    it('should populate the generated preview after fetching', () => {
      fixture.detectChanges();

      expect(component.configurationPreview()).toBe(mockConfiguration);
    });

    it('should call markForCheck after receiving configuration', () => {
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      fixture.detectChanges();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should expose the server file as structured interface data', () => {
      fixture.detectChanges();

      expect(component.interfaces()).toHaveLength(1);
      expect(component.interfaces()[0]).toMatchObject({
        name: 'eth0',
        enabled: true,
        ipv4Mode: 'dhcp',
        hostname: 'DockerContainer',
      });
      expect(component.loading()).toBe(false);
    });

    it('should render hostname and omit the disabled-interface startup message', () => {
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Hostname');
      expect(text).not.toContain('Container status');
      expect(text).not.toContain('This interface will not be configured at container startup.');
    });

    it('should mark a configured interface active while its container is running', () => {
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.network-editor__status-dot--active')).toBeTruthy();
    });

    it('should provide every IPv4 subnet mask from /32 through /0', () => {
      fixture.detectChanges();

      expect(component.subnetMasks).toHaveLength(33);
      expect(component.subnetMasks[0]).toEqual({ value: '255.255.255.255', label: '255.255.255.255 (/32)' });
      expect(component.subnetMasks[8]).toEqual({ value: '255.255.255.0', label: '255.255.255.0 (/24)' });
      expect(component.subnetMasks[32]).toEqual({ value: '0.0.0.0', label: '0.0.0.0 (/0)' });
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save network configuration via NodeService', () => {
      component.onSaveClick();

      expect(mockNodeService.saveNetworkConfiguration).toHaveBeenCalledWith(
        mockController,
        mockNode,
        component.configurationPreview()
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

    it('should serialize edits made through the structured interface model', () => {
      component.updateInterface(0, {
        ipv4Mode: 'static',
        ipv4Address: '192.168.50.2',
        netmask: '255.255.255.0',
        ipv4Gateway: '192.168.50.1',
        hostname: 'static-node',
      });

      component.onSaveClick();

      const savedConfiguration = mockNodeService.saveNetworkConfiguration.mock.calls[0][2];
      expect(savedConfiguration).toContain('iface eth0 inet static');
      expect(savedConfiguration).toContain('\taddress 192.168.50.2');
      expect(savedConfiguration).toContain('\tgateway 192.168.50.1');
      expect(savedConfiguration).toContain('\thostname static-node');
    });

    it('should reject invalid static IPv4 configuration', () => {
      component.updateInterface(0, {
        ipv4Mode: 'static',
        ipv4Address: '999.1.1.1',
        netmask: '255.255.255.0',
      });

      component.onSaveClick();

      expect(mockNodeService.saveNetworkConfiguration).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Enter a valid IPv4 address');
      expect(component.errorFor(0, 'ipv4Address')).toBe('Enter a valid IPv4 address');
    });

    it('should reject invalid DNS, MTU, and IPv6 values', () => {
      component.updateInterface(0, {
        dnsNameservers: 'not-an-address',
        mtu: '12',
        ipv6Mode: 'static',
        ipv6Address: 'invalid',
        prefixLength: '129',
      });

      component.onSaveClick();

      expect(mockNodeService.saveNetworkConfiguration).not.toHaveBeenCalled();
      expect(component.validationErrors()).toMatchObject({
        '0.dnsNameservers': 'Enter valid IPv4 or IPv6 DNS addresses',
        '0.mtu': 'MTU must be between 68 and 65535',
        '0.ipv6Address': 'Enter a valid IPv6 address',
        '0.prefixLength': 'Prefix length must be between 0 and 128',
      });
    });

    it('should reject an invalid DHCP hostname', () => {
      component.updateInterface(0, { hostname: 'not a valid hostname' });

      component.onSaveClick();

      expect(mockNodeService.saveNetworkConfiguration).not.toHaveBeenCalled();
      expect(component.errorFor(0, 'hostname')).toBe('Enter a valid hostname');
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog without saving', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockNodeService.saveNetworkConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('Zoneless Change Detection', () => {
    it('should update configuration after async operation in ngOnInit', () => {
      fixture.detectChanges();

      expect(component.configurationPreview()).toBe(mockConfiguration);
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
      expect(component.loadFailed()).toBe(true);
    });

    it('should show error toast when saveNetworkConfiguration fails', () => {
      mockNodeService.saveNetworkConfiguration.mockReturnValue(
        throwError(() => new Error('Failed to save network configuration'))
      );
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      fixture.detectChanges();

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to save network configuration');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
