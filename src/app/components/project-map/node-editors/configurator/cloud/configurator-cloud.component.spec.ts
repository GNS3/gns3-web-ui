import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { of, throwError } from 'rxjs';
import { ConfiguratorDialogCloudComponent } from './configurator-cloud.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { CloudValidationService } from '@services/validation';
import { UdpTunnelsComponent } from '@components/preferences/common/udp-tunnels/udp-tunnels.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogCloudComponent', () => {
  let component: ConfiguratorDialogCloudComponent;
  let fixture: ComponentFixture<ConfiguratorDialogCloudComponent>;

  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockBuiltInTemplatesConfigurationService: any;
  let mockCloudValidationService: any;
  let mockChangeDetectorRef: any;
  let mockUdpTunnelsData: any[] = [];

  let mockController: Controller;
  let mockNode: Node;

  const createMockNode = (): Node => ({
    node_id: 'node-1',
    name: 'Cloud-1',
    tags: ['tag1', 'tag2'],
    command_line: '',
    compute_id: 'local',
    console: 3080,
    console_auto_start: false,
    console_host: 'localhost',
    console_type: 'telnet',
    first_port_name: 'eth0',
    height: 50,
    label: { rotation: 0, style: '', text: 'Cloud-1', x: 0, y: 0 },
    locked: false,
    node_directory: '/tmp/node',
    node_type: 'cloud',
    port_name_format: 'eth{0}',
    port_segment_size: 1,
    ports: [],
    project_id: 'project-1',
    properties: {
      ports_mapping: [
        { interface: 'eth0', name: 'eth0', port_number: 0, type: 'ethernet' },
        { interface: 'tap0', name: 'tap0', port_number: 1, type: 'tap' },
      ],
      remote_console_host: 'localhost',
      remote_console_port: 3080,
      remote_console_http_path: '/',
      usage: 'Test usage',
    } as any,
    status: 'stopped',
    symbol: 'cloud',
    symbol_url: 'http://localhost:3080/v4/symbols/cloud/raw',
    width: 50,
    x: 100,
    y: 100,
    z: 0,
  });

  const createMockController = (): Controller => ({
    id: 1,
    authToken: 'token',
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '/',
    ubridge_path: '/usr/bin/ubridge',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
    status: 'running',
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockController = createMockController();
    mockNode = createMockNode();
    mockUdpTunnelsData = [];

    mockDialogRef = {
      close: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockBuiltInTemplatesConfigurationService = {
      getConsoleTypesForCloudNodes: vi.fn().mockReturnValue(['telnet', 'vnc', 'spice', 'http', 'https', 'none']),
      getEtherTypesForEthernetSwitches: vi.fn().mockReturnValue(['0x8100', '0x88A8', '0x9100', '0x9200']),
      getPortTypesForEthernetSwitches: vi.fn().mockReturnValue(['access', 'dot1q', 'qinq']),
    };

    mockCloudValidationService = {
      validateName: vi.fn().mockReturnValue({ isValid: true }),
      validateRemoteConsolePort: vi.fn().mockReturnValue({ isValid: true }),
      validateConsoleType: vi.fn().mockReturnValue({ isValid: true }),
      validateRemoteConsoleHost: vi.fn().mockReturnValue({ isValid: true }),
      validateRemoteConsoleHttpPath: vi.fn().mockReturnValue({ isValid: true }),
      validateInterfaceName: vi.fn().mockReturnValue({ isValid: true }),
      validateUniqueInterface: vi.fn().mockReturnValue({ isValid: true }),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of({ ...mockNode })),
      updateNode: vi.fn().mockReturnValue(of({ ...mockNode })),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatCardModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatChipsModule,
        MatIconModule,
        UdpTunnelsComponent,
        ConfiguratorDialogCloudComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: BuiltInTemplatesConfigurationService, useValue: mockBuiltInTemplatesConfigurationService },
        { provide: CloudValidationService, useValue: mockCloudValidationService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogCloudComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
    component.portsMappingUdp = mockUdpTunnelsData;
    component.name = 'Cloud-1';
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component initialization', () => {
    it('should initialize model signals for form fields', () => {
      expect(component.nodeName).toBeTruthy();
      expect(component.consoleType).toBeTruthy();
      expect(component.remoteConsoleHost).toBeTruthy();
      expect(component.remoteConsolePort).toBeTruthy();
      expect(component.remoteConsoleHttpPath).toBeTruthy();
      expect(component.usage).toBeTruthy();
    });

    it('should initialize consoleType to none', () => {
      expect(component.consoleType()).toBe('none');
    });
  });

  describe('ngOnInit', () => {
    it('should fetch node and populate model signals', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
      expect(component.nodeName()).toBe('Cloud-1');
      expect(component.consoleType()).toBe('telnet');
    });

    it('should populate portsMappingEthernet from node properties', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.portsMappingEthernet.length).toBeGreaterThan(0);
      expect(component.portsMappingEthernet[0].type).toBe('ethernet');
    });

    it('should populate portsMappingTap from node properties', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.portsMappingTap.length).toBeGreaterThan(0);
      expect(component.portsMappingTap[0].type).toBe('tap');
    });

    it('should populate all model signals with node data', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.nodeName()).toBe('Cloud-1');
      expect(component.consoleType()).toBe('telnet');
      expect(component.remoteConsoleHost()).toBe('localhost');
      expect(component.remoteConsolePort()).toBe('3080');
      expect(component.remoteConsoleHttpPath()).toBe('/');
      expect(component.usage()).toBe('Test usage');
    });
  });

  describe('getConfiguration', () => {
    it('should populate consoleTypes from builtInTemplatesConfigurationService', () => {
      component.getConfiguration();

      expect(mockBuiltInTemplatesConfigurationService.getConsoleTypesForCloudNodes).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'spice', 'http', 'https', 'none']);
    });
  });

  describe('onAddEthernetInterface', () => {
    beforeEach(() => {
      mockCloudValidationService.validateInterfaceName.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateUniqueInterface.mockReturnValue({ isValid: true });
    });

    it('should add ethernet interface to portsMappingEthernet when interface is selected', () => {
      component.ethernetInterface.set('Ethernet 2');
      const initialLength = component.portsMappingEthernet.length;

      component.onAddEthernetInterface();

      expect(component.portsMappingEthernet.length).toBe(initialLength + 1);
      expect(component.portsMappingEthernet[component.portsMappingEthernet.length - 1].interface).toBe('Ethernet 2');
      expect(component.portsMappingEthernet[component.portsMappingEthernet.length - 1].type).toBe('ethernet');
    });

    it('should not add ethernet interface when ethernetInterface is empty', () => {
      component.ethernetInterface.set('');
      const initialLength = component.portsMappingEthernet.length;

      component.onAddEthernetInterface();

      expect(component.portsMappingEthernet.length).toBe(initialLength);
    });

    it('should validate interface name before adding', () => {
      component.ethernetInterface.set('eth0');

      component.onAddEthernetInterface();

      expect(mockCloudValidationService.validateInterfaceName).toHaveBeenCalledWith('eth0');
    });

    it('should show error when interface name validation fails', () => {
      mockCloudValidationService.validateInterfaceName.mockReturnValue({
        isValid: false,
        errorMessage: 'Interface name is required',
      });
      component.ethernetInterface.set('   '); // Whitespace only, not empty
      const initialLength = component.portsMappingEthernet.length;

      component.onAddEthernetInterface();

      expect(component.portsMappingEthernet.length).toBe(initialLength);
      expect(mockToasterService.error).toHaveBeenCalledWith('Interface name is required');
    });

    it('should check for duplicate interface names', () => {
      component.ethernetInterface.set('eth0');
      component.portsMappingEthernet = [
        { interface: 'eth0', name: 'eth0', port_number: 0, type: 'ethernet' },
      ];

      component.onAddEthernetInterface();

      expect(mockCloudValidationService.validateUniqueInterface).toHaveBeenCalled();
    });

    it('should show error when interface already exists', () => {
      mockCloudValidationService.validateUniqueInterface.mockReturnValue({
        isValid: false,
        errorMessage: 'Interface eth0 already configured.',
      });
      component.ethernetInterface.set('eth0');
      component.portsMappingEthernet = [
        { interface: 'eth0', name: 'eth0', port_number: 0, type: 'ethernet' },
      ];

      component.onAddEthernetInterface();

      expect(mockToasterService.error).toHaveBeenCalledWith('Interface eth0 already configured.');
    });
  });

  describe('onAddTapInterface', () => {
    beforeEach(() => {
      mockCloudValidationService.validateInterfaceName.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateUniqueInterface.mockReturnValue({ isValid: true });
    });

    it('should add tap interface to portsMappingTap when interface is specified', () => {
      component.tapInterface.set('tap0');
      const initialLength = component.portsMappingTap.length;

      component.onAddTapInterface();

      expect(component.portsMappingTap.length).toBe(initialLength + 1);
      expect(component.portsMappingTap[component.portsMappingTap.length - 1].interface).toBe('tap0');
      expect(component.portsMappingTap[component.portsMappingTap.length - 1].type).toBe('tap');
    });

    it('should not add tap interface when tapInterface is empty', () => {
      component.tapInterface.set('');
      const initialLength = component.portsMappingTap.length;

      component.onAddTapInterface();

      expect(component.portsMappingTap.length).toBe(initialLength);
    });

    it('should validate interface name before adding', () => {
      component.tapInterface.set('tap0');

      component.onAddTapInterface();

      expect(mockCloudValidationService.validateInterfaceName).toHaveBeenCalledWith('tap0');
    });

    it('should show error when interface name validation fails', () => {
      mockCloudValidationService.validateInterfaceName.mockReturnValue({
        isValid: false,
        errorMessage: 'Interface name is required',
      });
      component.tapInterface.set('   '); // Whitespace only, not empty
      const initialLength = component.portsMappingTap.length;

      component.onAddTapInterface();

      expect(component.portsMappingTap.length).toBe(initialLength);
      expect(mockToasterService.error).toHaveBeenCalledWith('Interface name is required');
    });

    it('should check for duplicate interface names', () => {
      component.tapInterface.set('tap0');
      component.portsMappingTap = [
        { interface: 'tap0', name: 'tap0', port_number: 0, type: 'tap' },
      ];

      component.onAddTapInterface();

      expect(mockCloudValidationService.validateUniqueInterface).toHaveBeenCalled();
    });

    it('should show error when interface already exists', () => {
      mockCloudValidationService.validateUniqueInterface.mockReturnValue({
        isValid: false,
        errorMessage: 'Interface tap0 already configured.',
      });
      component.tapInterface.set('tap0');
      component.portsMappingTap = [
        { interface: 'tap0', name: 'tap0', port_number: 0, type: 'tap' },
      ];

      component.onAddTapInterface();

      expect(mockToasterService.error).toHaveBeenCalledWith('Interface tap0 already configured.');
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockCloudValidationService.validateName.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateRemoteConsolePort.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateConsoleType.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateRemoteConsoleHost.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateRemoteConsoleHttpPath.mockReturnValue({ isValid: true });
    });

    it('should call updateNode when validation passes', () => {
      component.nodeName.set('Cloud-1');
      component.consoleType.set('telnet');
      component.remoteConsoleHost.set('localhost');
      component.remoteConsolePort.set('3080');
      component.remoteConsoleHttpPath.set('/');
      component.usage.set('Test');
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalled();
    });

    it('should close dialog on successful update', () => {
      component.nodeName.set('Cloud-1');
      component.consoleType.set('telnet');
      component.remoteConsoleHost.set('localhost');
      component.remoteConsolePort.set('3080');
      component.remoteConsoleHttpPath.set('/');
      component.usage.set('Test');
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast on successful update', () => {
      component.nodeName.set('Cloud-1');
      component.consoleType.set('telnet');
      component.remoteConsoleHost.set('localhost');
      component.remoteConsolePort.set('3080');
      component.remoteConsoleHttpPath.set('/');
      component.usage.set('Test');
      component.node = { ...mockNode, name: 'Cloud-1' };

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Cloud-1 updated.');
    });

    it('should show error toast when name is empty', () => {
      mockCloudValidationService.validateName.mockReturnValue({
        isValid: false,
        errorMessage: 'Name is required',
      });
      component.nodeName.set('');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Name is required');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should show error toast when remote console port is invalid', () => {
      mockCloudValidationService.validateName.mockReturnValue({ isValid: true });
      mockCloudValidationService.validateRemoteConsolePort.mockReturnValue({
        isValid: false,
        errorMessage: 'Remote console port must be between 1 and 65535',
      });
      component.nodeName.set('Cloud-1');
      component.remoteConsolePort.set('99999');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Remote console port must be between 1 and 65535');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should merge model signal values back into node properties', () => {
      component.nodeName.set('Cloud-New');
      component.consoleType.set('vnc');
      component.remoteConsoleHost.set('remotehost');
      component.remoteConsolePort.set('8080');
      component.remoteConsoleHttpPath.set('/console');
      component.usage.set('New usage');
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(component.node.name).toBe('Cloud-New');
      expect(component.node.console_type).toBe('vnc');
      expect(component.node.properties.remote_console_host).toBe('remotehost');
      expect(component.node.properties.remote_console_port).toBe(8080);
      expect(component.node.properties.remote_console_http_path).toBe('/console');
      expect(component.node.properties.usage).toBe('New usage');
    });

    it('should call validation methods', () => {
      component.nodeName.set('Cloud-1');
      component.consoleType.set('telnet');
      component.remoteConsoleHost.set('localhost');
      component.remoteConsolePort.set('3080');
      component.remoteConsoleHttpPath.set('/');
      component.usage.set('Test');
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockCloudValidationService.validateName).toHaveBeenCalledWith('Cloud-1');
      expect(mockCloudValidationService.validateRemoteConsolePort).toHaveBeenCalledWith('3080');
      expect(mockCloudValidationService.validateConsoleType).toHaveBeenCalledWith('telnet', component.consoleTypes);
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('addTag', () => {
    it('should add tag to node tags', () => {
      const event = {
        value: 'new-tag',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: ['existing'] };
      component.addTag(event);

      expect(component.node.tags).toContain('new-tag');
    });

    it('should initialize tags array if undefined', () => {
      const event = {
        value: 'new-tag',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: undefined };
      component.addTag(event);

      expect(component.node.tags).toEqual(['new-tag']);
    });

    it('should clear chip input after adding tag', () => {
      const chipInputClearSpy = vi.fn();
      const event = {
        value: 'new-tag',
        chipInput: { clear: chipInputClearSpy },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: [] };
      component.addTag(event);

      expect(chipInputClearSpy).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      const event = {
        value: '',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: [] };
      component.addTag(event);

      expect(component.node.tags).toEqual([]);
    });

    it('should not add whitespace-only tag', () => {
      const event = {
        value: '   ',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: [] };
      component.addTag(event);

      expect(component.node.tags).toEqual([]);
    });
  });

  describe('removeTag', () => {
    it('should remove tag from node tags', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2', 'tag3'] };

      component.removeTag('tag2');

      expect(component.node.tags).not.toContain('tag2');
      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not modify tags if tag not found', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2'] };

      component.removeTag('nonexistent');

      expect(component.node.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle undefined tags gracefully', () => {
      component.node = { ...mockNode, tags: undefined };

      expect(() => component.removeTag('tag')).not.toThrow();
    });
  });

  describe('dialog title', () => {
    it('should display node name in title', () => {
      component.name = 'Cloud-1';
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(title.textContent).toContain('Cloud-1');
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
      component.nodeName.set('Cloud-1');
      component.consoleType.set('telnet');
      component.remoteConsoleHost.set('localhost');
      component.remoteConsolePort.set('3080');
      component.remoteConsoleHttpPath.set('/');
      component.usage.set('Test');
      component.node = { ...mockNode };
      component.portsMappingUdp = mockUdpTunnelsData;

      // Mock udpTunnels viewChild
      Object.defineProperty(component, 'udpTunnels', {
        get: () => () => ({ dataSourceUdp: mockUdpTunnelsData }),
        configurable: true,
      });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
