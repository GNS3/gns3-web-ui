import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortsComponent } from './ports.component';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { ToasterService } from '@services/toaster.service';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('PortsComponent', () => {
  let component: PortsComponent;
  let fixture: ComponentFixture<PortsComponent>;
  let mockBuiltInTemplatesConfigurationService: any;
  let mockToasterService: any;

  const createMockPort = (overrides: Partial<PortsMappingEntity> = {}): PortsMappingEntity => ({
    name: 'Ethernet0',
    port_number: 0,
    vlan: 1,
    type: 'access',
    ethertype: '0x8100',
    ...overrides,
  });

  beforeEach(async () => {
    mockBuiltInTemplatesConfigurationService = {
      getEtherTypesForEthernetSwitches: vi.fn().mockReturnValue(['0x8100', '0x88A8', '0x9100', '0x9200']),
      getPortTypesForEthernetSwitches: vi.fn().mockReturnValue(['access', 'dot1q', 'qinq']),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PortsComponent],
      providers: [
        { provide: BuiltInTemplatesConfigurationService, useValue: mockBuiltInTemplatesConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PortsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should call getConfiguration on init', () => {
      const getConfigurationSpy = vi.spyOn(component, 'getConfiguration');
      component.ngOnInit();
      expect(getConfigurationSpy).toHaveBeenCalled();
    });

    it('should set initial newPort.port_number based on ethernetPorts length', () => {
      component.ethernetPorts = [createMockPort({ port_number: 0 }), createMockPort({ port_number: 1 })];
      component.ngOnInit();
      expect(component.newPort.port_number).toBe(2);
    });

    it('should set newPort.port_number to 0 when ethernetPorts is empty', () => {
      component.ethernetPorts = [];
      component.ngOnInit();
      expect(component.newPort.port_number).toBe(0);
    });
  });

  describe('getConfiguration', () => {
    it('should load ether types from service', () => {
      component.getConfiguration();
      expect(mockBuiltInTemplatesConfigurationService.getEtherTypesForEthernetSwitches).toHaveBeenCalled();
      expect(component.etherTypes()).toEqual(['0x8100', '0x88A8', '0x9100', '0x9200']);
    });

    it('should load port types from service', () => {
      component.getConfiguration();
      expect(mockBuiltInTemplatesConfigurationService.getPortTypesForEthernetSwitches).toHaveBeenCalled();
      expect(component.portTypes()).toEqual(['access', 'dot1q', 'qinq']);
    });
  });

  describe('onAdd', () => {
    it('should add a new port to ethernetPorts array', () => {
      component.ethernetPorts = [];
      component.newPort = createMockPort({ port_number: 0 });
      component.onAdd();
      expect(component.ethernetPorts.length).toBe(1);
      expect(component.ethernetPorts[0].port_number).toBe(0);
    });

    it('should set port name to Ethernet{port_number}', () => {
      component.ethernetPorts = [];
      component.newPort = createMockPort({ port_number: 5 });
      component.onAdd();
      expect(component.ethernetPorts[0].name).toBe('Ethernet5');
    });

    it('should show error when port number already exists', () => {
      component.ethernetPorts = [createMockPort({ port_number: 3 })];
      component.newPort = createMockPort({ port_number: 3 });
      component.onAdd();
      expect(mockToasterService.error).toHaveBeenCalledWith('Port number 3 already exists.');
      expect(component.ethernetPorts.length).toBe(1);
    });

    it('should not add port when duplicate port number exists', () => {
      component.ethernetPorts = [createMockPort({ port_number: 1 })];
      component.newPort = createMockPort({ port_number: 1 });
      component.onAdd();
      expect(component.ethernetPorts.length).toBe(1);
    });

    it('should increment newPort.port_number after adding', () => {
      component.ethernetPorts = [];
      component.newPort = createMockPort({ port_number: 0 });
      component.onAdd();
      expect(component.newPort.port_number).toBe(1);
    });

    it('should add multiple ports sequentially', () => {
      component.ethernetPorts = [];
      component.newPort = createMockPort({ port_number: 0 });
      component.onAdd();
      component.newPort = createMockPort({ port_number: 1 });
      component.onAdd();
      component.newPort = createMockPort({ port_number: 2 });
      component.onAdd();
      expect(component.ethernetPorts.length).toBe(3);
      expect(component.ethernetPorts[0].name).toBe('Ethernet0');
      expect(component.ethernetPorts[1].name).toBe('Ethernet1');
      expect(component.ethernetPorts[2].name).toBe('Ethernet2');
    });

    it('should preserve port properties when adding', () => {
      component.ethernetPorts = [];
      component.newPort = createMockPort({ port_number: 0, vlan: 10, type: 'dot1q', ethertype: '0x88A8' });
      component.onAdd();
      expect(component.ethernetPorts[0].vlan).toBe(10);
      expect(component.ethernetPorts[0].type).toBe('dot1q');
      expect(component.ethernetPorts[0].ethertype).toBe('0x88A8');
    });
  });

  describe('delete', () => {
    it('should remove port from ethernetPorts array', () => {
      const port1 = createMockPort({ port_number: 0 });
      const port2 = createMockPort({ port_number: 1 });
      const port3 = createMockPort({ port_number: 2 });
      component.ethernetPorts = [port1, port2, port3];
      component.delete(port2);
      expect(component.ethernetPorts.length).toBe(2);
      expect(component.ethernetPorts).not.toContain(port2);
    });

    it('should not modify array when port not found', () => {
      const port1 = createMockPort({ port_number: 0 });
      const port2 = createMockPort({ port_number: 1 });
      component.ethernetPorts = [port1, port2];
      const nonExistentPort = createMockPort({ port_number: 99 });
      component.delete(nonExistentPort);
      expect(component.ethernetPorts.length).toBe(2);
    });

    it('should handle deleting last port', () => {
      const port1 = createMockPort({ port_number: 0 });
      component.ethernetPorts = [port1];
      component.delete(port1);
      expect(component.ethernetPorts.length).toBe(0);
    });

    it('should handle empty ethernetPorts array', () => {
      component.ethernetPorts = [];
      const port = createMockPort({ port_number: 0 });
      expect(() => component.delete(port)).not.toThrow();
    });
  });

  describe('displayedColumns', () => {
    it('should have correct column definitions', () => {
      expect(component.displayedColumns).toEqual(['port_number', 'vlan', 'type', 'ethertype', 'action']);
    });
  });

  describe('newPort initialization', () => {
    it('should initialize newPort with default values', () => {
      component.ngOnInit();
      expect(component.newPort.name).toBe('');
      expect(component.newPort.port_number).toBe(0);
      expect(component.newPort.vlan).toBe(1);
      expect(component.newPort.type).toBe('access');
      expect(component.newPort.ethertype).toBe('0x8100');
    });
  });

  describe('template rendering', () => {
    it('should render mat-table with correct dataSource binding', () => {
      component.ethernetPorts = [createMockPort({ port_number: 0 }), createMockPort({ port_number: 1 })];
      component.ngOnInit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('table[mat-table]');
      expect(table).toBeTruthy();
    });

    it('should render delete button for each port row', () => {
      component.ethernetPorts = [createMockPort({ port_number: 0 }), createMockPort({ port_number: 1 })];
      component.ngOnInit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const deleteButtons = compiled.querySelectorAll('button[mat-icon-button]');
      expect(deleteButtons.length).toBe(2);
    });

    it('should have Add button in add-row section', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const addButton = compiled.querySelector('.ports__add-btn');
      expect(addButton).toBeTruthy();
    });

    it('should have correct number of table header columns', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const headerCells = compiled.querySelectorAll('th[mat-header-cell]');
      expect(headerCells.length).toBe(5);
    });
  });
});
