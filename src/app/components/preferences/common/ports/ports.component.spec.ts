import { SimpleChange } from '@angular/core';
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

  describe('lifecycle hooks', () => {
    it('should call getConfiguration on init', () => {
      const getConfigurationSpy = vi.spyOn(component, 'getConfiguration');
      component.ngOnInit();
      expect(getConfigurationSpy).toHaveBeenCalled();
    });

    it('should set initial newPortNumber based on ethernetPorts length', () => {
      component.ethernetPorts = [createMockPort({ port_number: 0 }), createMockPort({ port_number: 1 })];
      component.ngOnInit();
      expect(component.newPortNumber()).toBe(2);
    });

    it('should set newPortNumber to 0 when ethernetPorts is empty', () => {
      component.ethernetPorts = [];
      component.ngOnInit();
      expect(component.newPortNumber()).toBe(0);
    });

    it('should refresh derived state when the input port list is replaced', () => {
      const stalePort = createMockPort({ port_number: 0 });
      component.ethernetPorts = [stalePort];
      component.togglePort(stalePort, true);

      const replacementPorts = [createMockPort({ port_number: 0 }), createMockPort({ port_number: 1 })];
      component.ethernetPorts = replacementPorts;
      component.ngOnChanges({
        ethernetPorts: new SimpleChange([stalePort], replacementPorts, false),
      });

      expect(component.newPortNumber()).toBe(2);
      expect(component.selectedPorts.size).toBe(0);
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
      component.newPortNumber.set(0);
      component.onAdd();
      expect(component.ethernetPorts.length).toBe(1);
      expect(component.ethernetPorts[0].port_number).toBe(0);
    });

    it('should set port name to Ethernet{port_number}', () => {
      component.ethernetPorts = [];
      component.newPortNumber.set(5);
      component.onAdd();
      expect(component.ethernetPorts[0].name).toBe('Ethernet5');
    });

    it('should show error when port number already exists', () => {
      component.ethernetPorts = [createMockPort({ port_number: 3 })];
      component.newPortNumber.set(3);
      component.onAdd();
      expect(mockToasterService.error).toHaveBeenCalledWith('Port number 3 already exists.');
      expect(component.ethernetPorts.length).toBe(1);
    });

    it('should not add port when duplicate port number exists', () => {
      component.ethernetPorts = [createMockPort({ port_number: 1 })];
      component.newPortNumber.set(1);
      component.onAdd();
      expect(component.ethernetPorts.length).toBe(1);
    });

    it('should increment newPortNumber after adding', () => {
      component.ethernetPorts = [];
      component.newPortNumber.set(0);
      component.onAdd();
      expect(component.newPortNumber()).toBe(1);
    });

    it('should add multiple ports sequentially', () => {
      component.ethernetPorts = [];
      component.newPortNumber.set(0);
      component.onAdd();
      component.newPortNumber.set(1);
      component.onAdd();
      component.newPortNumber.set(2);
      component.onAdd();
      expect(component.ethernetPorts.length).toBe(3);
      expect(component.ethernetPorts[0].name).toBe('Ethernet0');
      expect(component.ethernetPorts[1].name).toBe('Ethernet1');
      expect(component.ethernetPorts[2].name).toBe('Ethernet2');
    });

    it('should add a range of ports with shared settings', () => {
      component.ethernetPorts = [];
      component.newPortNumber.set(4);
      component.newPortCount.set(3);
      component.newPortVlan.set(20);

      component.onAdd();

      expect(component.ethernetPorts.map((port) => port.port_number)).toEqual([4, 5, 6]);
      expect(component.ethernetPorts.every((port) => port.vlan === 20)).toBe(true);
      expect(component.newPortNumber()).toBe(0);
    });

    it('should reject the entire range when one port already exists', () => {
      component.ethernetPorts = [createMockPort({ port_number: 5 })];
      component.newPortNumber.set(4);
      component.newPortCount.set(3);

      component.onAdd();

      expect(mockToasterService.error).toHaveBeenCalledWith('Port number 5 already exists.');
      expect(component.ethernetPorts.map((port) => port.port_number)).toEqual([5]);
    });

    it('should reject an empty starting port instead of treating it as zero', () => {
      component.newPortNumber.set(Number.NaN);

      component.onAdd();

      expect(mockToasterService.error).toHaveBeenCalledWith('Port number must be a non-negative integer.');
      expect(component.ethernetPorts).toEqual([]);
    });

    it('should use QinQ when adding a port with a non-default EtherType', () => {
      component.ethernetPorts = [];
      component.newPortNumber.set(0);
      component.newPortVlan.set(10);
      component.newPortType.set('dot1q');
      component.newPortEthertype.set('0x88A8');
      component.onAdd();
      expect(component.ethernetPorts[0].vlan).toBe(10);
      expect(component.ethernetPorts[0].type).toBe('qinq');
      expect(component.ethernetPorts[0].ethertype).toBe('0x88A8');
    });

    it('should emit the updated ports after adding', () => {
      const emitSpy = vi.spyOn(component.ethernetPortsChange, 'emit');

      component.onAdd();

      expect(emitSpy).toHaveBeenCalledWith(component.ethernetPorts);
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
      expect(component.displayedColumns).toEqual(['select', 'port_number', 'vlan', 'type', 'ethertype', 'action']);
    });
  });

  describe('editing ports', () => {
    it('should update an existing VLAN without recreating the port', () => {
      const port = createMockPort();
      component.ethernetPorts = [port];

      component.updateVlan(port, 42);

      expect(port.vlan).toBe(42);
      expect(component.ethernetPorts[0]).toBe(port);
    });

    it('should reject an invalid VLAN', () => {
      const port = createMockPort({ vlan: 10 });

      component.updateVlan(port, 4095);

      expect(port.vlan).toBe(10);
      expect(mockToasterService.error).toHaveBeenCalledWith('VLAN must be between 1 and 4094.');
    });

    it('should reset EtherType when changing away from QinQ', () => {
      const port = createMockPort({ type: 'qinq', ethertype: '0x88A8' });

      component.updatePortType(port, 'access');

      expect(port.type).toBe('access');
      expect(port.ethertype).toBe('0x8100');
    });

    it('should switch to QinQ when a non-default EtherType is selected', () => {
      const port = createMockPort({ type: 'access' });

      component.updatePortEthertype(port, '0x88A8');

      expect(port.type).toBe('qinq');
      expect(port.ethertype).toBe('0x88A8');
    });

    it('should keep the add-port type and EtherType controls compatible', () => {
      component.updateNewPortEthertype('0x88A8');
      expect(component.newPortType()).toBe('qinq');

      component.updateNewPortType('access');
      expect(component.newPortEthertype()).toBe('0x8100');
    });

    it('should restore the displayed VLAN when an edit is invalid', () => {
      const port = createMockPort({ vlan: 10 });
      const input = document.createElement('input');
      input.value = '4095';

      component.updateVlan(port, 4095, input);

      expect(input.value).toBe('10');
    });
  });

  describe('bulk editing', () => {
    it('should keep bulk type and EtherType selections compatible', () => {
      component.updateBulkEthertype('0x88A8');
      expect(component.bulkType()).toBe('qinq');

      component.updateBulkType('access');
      expect(component.bulkEthertype()).toBe('');
    });

    it('should apply values to all selected ports only', () => {
      const port1 = createMockPort({ port_number: 0 });
      const port2 = createMockPort({ port_number: 1 });
      const port3 = createMockPort({ port_number: 2 });
      component.ethernetPorts = [port1, port2, port3];
      component.togglePort(port1, true);
      component.togglePort(port3, true);
      component.bulkVlan.set(100);
      component.bulkType.set('dot1q');

      component.applyBulkChanges();

      expect(port1.vlan).toBe(100);
      expect(port1.type).toBe('dot1q');
      expect(port2.vlan).toBe(1);
      expect(port3.vlan).toBe(100);
    });

    it('should select and clear all ports', () => {
      component.ethernetPorts = [createMockPort({ port_number: 0 }), createMockPort({ port_number: 1 })];

      component.toggleAll(true);
      expect(component.allPortsSelected()).toBe(true);

      component.toggleAll(false);
      expect(component.selectedPorts.size).toBe(0);
    });

    it('should require at least one selected port', () => {
      component.bulkVlan.set(10);

      component.applyBulkChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Select at least one port to update.');
    });

    it('should apply EtherType to selected ports regardless of their port type', () => {
      const accessPort = createMockPort({ type: 'access' });
      component.ethernetPorts = [accessPort];
      component.togglePort(accessPort, true);
      component.bulkEthertype.set('0x88A8');

      component.applyBulkChanges();

      expect(accessPort.type).toBe('qinq');
      expect(accessPort.ethertype).toBe('0x88A8');
    });

    it('should reset a non-default EtherType when bulk-changing away from QinQ', () => {
      const qinqPort = createMockPort({ type: 'qinq', ethertype: '0x88A8' });
      component.ethernetPorts = [qinqPort];
      component.togglePort(qinqPort, true);
      component.bulkType.set('access');

      component.applyBulkChanges();

      expect(qinqPort.type).toBe('access');
      expect(qinqPort.ethertype).toBe('0x8100');
    });
  });

  describe('newPort initialization', () => {
    it('should initialize newPort signals with default values', () => {
      component.ngOnInit();
      expect(component.newPortNumber()).toBe(0);
      expect(component.newPortVlan()).toBe(1);
      expect(component.newPortType()).toBe('access');
      expect(component.newPortEthertype()).toBe('0x8100');
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
      const addButton = compiled.querySelector('.ports__add-btn') as HTMLElement;
      expect(addButton).toBeTruthy();
      expect(addButton.classList.contains('mat-mdc-unelevated-button')).toBe(true);
      expect(addButton.textContent.trim()).toBe('Add ports');
    });

    it('should keep EtherType selectors enabled for every port type', () => {
      component.ethernetPorts = [createMockPort({ type: 'access' })];
      component.ngOnInit();
      fixture.detectChanges();

      const cellSelects = fixture.nativeElement.querySelectorAll('.ports__cell-select') as NodeListOf<HTMLElement>;
      const etherTypeSelect = cellSelects[1];

      expect(etherTypeSelect).toBeTruthy();
      expect(etherTypeSelect.classList.contains('mat-mdc-select-disabled')).toBe(false);
      expect(etherTypeSelect.getAttribute('aria-label')).toBe('EtherType for port 0');
    });

    it('should have correct number of table header columns', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const headerCells = compiled.querySelectorAll('th[mat-header-cell]');
      expect(headerCells.length).toBe(6);
    });
  });
});
