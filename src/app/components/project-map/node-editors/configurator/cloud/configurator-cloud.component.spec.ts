import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { ConfiguratorDialogCloudComponent } from './configurator-cloud.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { UdpTunnelsComponent } from '@components/preferences/common/udp-tunnels/udp-tunnels.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogCloudComponent', () => {
  let component: ConfiguratorDialogCloudComponent;
  let fixture: ComponentFixture<ConfiguratorDialogCloudComponent>;

  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;
  let mockBuiltInTemplatesConfigurationService: any;
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

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of({ ...mockNode })),
      updateNode: vi.fn().mockReturnValue(of({ ...mockNode })),
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
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

  describe('ngOnInit', () => {
    it('should fetch node and populate form', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
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
  });

  describe('getConfiguration', () => {
    it('should populate consoleTypes from builtInTemplatesConfigurationService', () => {
      component.getConfiguration();

      expect(mockBuiltInTemplatesConfigurationService.getConsoleTypesForCloudNodes).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'spice', 'http', 'https', 'none']);
    });
  });

  describe('onAddEthernetInterface', () => {
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
  });

  describe('onAddTapInterface', () => {
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
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call updateNode when form is valid', () => {
      component.generalSettingsForm = {
        valid: true,
        value: {
          name: 'Cloud-1',
          console_type: 'telnet',
          remote_console_host: 'localhost',
          remote_console_port: 3080,
          remote_console_http_path: '/',
          usage: 'Test',
        },
      } as any;
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalled();
    });

    it('should close dialog on successful update', () => {
      component.generalSettingsForm = {
        valid: true,
        value: {
          name: 'Cloud-1',
          console_type: 'telnet',
          remote_console_host: 'localhost',
          remote_console_port: 3080,
          remote_console_http_path: '/',
          usage: 'Test',
        },
      } as any;
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast on successful update', () => {
      component.generalSettingsForm = {
        valid: true,
        value: {
          name: 'Cloud-1',
          console_type: 'telnet',
          remote_console_host: 'localhost',
          remote_console_port: 3080,
          remote_console_http_path: '/',
          usage: 'Test',
        },
      } as any;
      component.node = { ...mockNode, name: 'Cloud-1' };

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Cloud-1 updated.');
    });

    it('should show error toast when form is invalid', () => {
      component.generalSettingsForm = {
        valid: false,
      } as any;

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should merge form values back into node properties', () => {
      component.generalSettingsForm = {
        valid: true,
        value: {
          name: 'Cloud-New',
          console_type: 'vnc',
          remote_console_host: 'remotehost',
          remote_console_port: 8080,
          remote_console_http_path: '/console',
          usage: 'New usage',
        },
      } as any;
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(component.node.name).toBe('Cloud-New');
      expect(component.node.console_type).toBe('vnc');
      expect(component.node.properties.remote_console_host).toBe('remotehost');
      expect(component.node.properties.remote_console_port).toBe(8080);
      expect(component.node.properties.remote_console_http_path).toBe('/console');
      expect(component.node.properties.usage).toBe('New usage');
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
});
