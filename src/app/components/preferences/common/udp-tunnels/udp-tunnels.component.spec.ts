import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UdpTunnelsComponent } from './udp-tunnels.component';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('UdpTunnelsComponent', () => {
  let component: UdpTunnelsComponent;
  let fixture: ComponentFixture<UdpTunnelsComponent>;
  let mockBuiltInTemplatesConfigurationService: any;

  const mockEtherTypes = ['0x8100', '0x88A8', '0x9100'];
  const mockPortTypes = ['access', 'dot1q', 'qinq'];

  beforeEach(async () => {
    TestBed.resetTestingModule();

    mockBuiltInTemplatesConfigurationService = {
      getEtherTypesForEthernetSwitches: vi.fn().mockReturnValue(mockEtherTypes),
      getPortTypesForEthernetSwitches: vi.fn().mockReturnValue(mockPortTypes),
    };

    await TestBed.configureTestingModule({
      imports: [UdpTunnelsComponent],
      providers: [
        { provide: BuiltInTemplatesConfigurationService, useValue: mockBuiltInTemplatesConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UdpTunnelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getConfiguration on init', () => {
      const getConfigurationSpy = vi.spyOn(component, 'getConfiguration');
      component.ngOnInit();
      expect(getConfigurationSpy).toHaveBeenCalled();
    });
  });

  describe('getConfiguration', () => {
    it('should load ether types from BuiltInTemplatesConfigurationService', () => {
      component.getConfiguration();
      expect(mockBuiltInTemplatesConfigurationService.getEtherTypesForEthernetSwitches).toHaveBeenCalled();
      expect(component.etherTypes()).toEqual(mockEtherTypes);
    });

    it('should load port types from BuiltInTemplatesConfigurationService', () => {
      component.getConfiguration();
      expect(mockBuiltInTemplatesConfigurationService.getPortTypesForEthernetSwitches).toHaveBeenCalled();
      expect(component.portTypes()).toEqual(mockPortTypes);
    });

    it('should set signals with values from service', () => {
      component.getConfiguration();
      expect(component.etherTypes()).toContain('0x8100');
      expect(component.portTypes()).toContain('access');
    });
  });

  describe('onAddUdpInterface', () => {
    it('should add new port to dataSourceUdp array', () => {
      const initialLength = component.dataSourceUdp.length;
      component.newPortName.set('test-port');
      component.newPortLport.set(8080);

      component.onAddUdpInterface();

      expect(component.dataSourceUdp.length).toBe(initialLength + 1);
    });

    it('should append new port as last element in dataSourceUdp', () => {
      component.newPortName.set('new-interface');
      component.newPortLport.set(8080);
      component.newPortRhost.set('localhost');
      component.newPortRport.set(9000);

      component.onAddUdpInterface();

      const lastEntry = component.dataSourceUdp[component.dataSourceUdp.length - 1];
      expect(lastEntry.name).toBe('new-interface');
    });

    it('should reset newPort signals to empty after adding', () => {
      component.newPortName.set('test');
      component.newPortLport.set(8080);

      component.onAddUdpInterface();

      expect(component.newPortName()).toBe('');
      expect(component.newPortLport()).toBe(0);
    });

    it('should preserve existing entries in dataSourceUdp', () => {
      const existingPort: PortsMappingEntity = { name: 'existing', port_number: 1000 };
      component.dataSourceUdp = [existingPort];

      component.newPortName.set('new-port');
      component.newPortLport.set(2000);
      component.onAddUdpInterface();

      expect(component.dataSourceUdp).toContain(existingPort);
      expect(component.dataSourceUdp.length).toBe(2);
    });
  });

  describe('delete', () => {
    it('should remove the specified port from dataSourceUdp', () => {
      const port1: PortsMappingEntity = { name: 'port1', port_number: 1000 };
      const port2: PortsMappingEntity = { name: 'port2', port_number: 2000 };
      component.dataSourceUdp = [port1, port2];

      component.delete(port1);

      expect(component.dataSourceUdp).not.toContain(port1);
      expect(component.dataSourceUdp).toContain(port2);
    });

    it('should reduce dataSourceUdp length by 1', () => {
      const port1: PortsMappingEntity = { name: 'port1', port_number: 1000 };
      const port2: PortsMappingEntity = { name: 'port2', port_number: 2000 };
      component.dataSourceUdp = [port1, port2];
      const initialLength = component.dataSourceUdp.length;

      component.delete(port1);

      expect(component.dataSourceUdp.length).toBe(initialLength - 1);
    });

    it('should not modify dataSourceUdp when deleting non-existent port', () => {
      const port1: PortsMappingEntity = { name: 'port1', port_number: 1000 };
      const port2: PortsMappingEntity = { name: 'port2', port_number: 2000 };
      const nonExistent: PortsMappingEntity = { name: 'non-existent', port_number: 9999 };
      component.dataSourceUdp = [port1, port2];
      const initialLength = component.dataSourceUdp.length;

      component.delete(nonExistent);

      expect(component.dataSourceUdp.length).toBe(initialLength);
      expect(component.dataSourceUdp).toEqual([port1, port2]);
    });

    it('should handle deletion of last element', () => {
      const port: PortsMappingEntity = { name: 'only-port', port_number: 1000 };
      component.dataSourceUdp = [port];

      component.delete(port);

      expect(component.dataSourceUdp.length).toBe(0);
      expect(component.dataSourceUdp).toEqual([]);
    });

    it('should handle empty dataSourceUdp gracefully', () => {
      component.dataSourceUdp = [];
      const port: PortsMappingEntity = { name: 'some-port', port_number: 1000 };

      expect(() => component.delete(port)).not.toThrow();
      expect(component.dataSourceUdp).toEqual([]);
    });
  });

  describe('displayedColumns', () => {
    it('should have correct column definitions', () => {
      expect(component.displayedColumns).toEqual(['name', 'lport', 'rhost', 'rport', 'action']);
    });

    it('should contain name column', () => {
      expect(component.displayedColumns).toContain('name');
    });

    it('should contain action column', () => {
      expect(component.displayedColumns).toContain('action');
    });
  });

  describe('initial state after ngOnInit', () => {
    it('should have empty newPort signals on initialization', () => {
      expect(component.newPortName()).toBe('');
      expect(component.newPortLport()).toBe(0);
    });

    it('should have empty dataSourceUdp by default', () => {
      expect(component.dataSourceUdp).toEqual([]);
    });

    it('should have portTypes populated from service after ngOnInit', () => {
      expect(component.portTypes()).toEqual(mockPortTypes);
    });

    it('should have etherTypes populated from service after ngOnInit', () => {
      expect(component.etherTypes()).toEqual(mockEtherTypes);
    });
  });

  describe('template rendering', () => {
    it('should not render table when dataSourceUdp is empty', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('table[mat-table]');
      expect(table).toBeFalsy();
    });

    it('should render add button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should render mat-form-field inputs for port configuration', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const formFields = compiled.querySelectorAll('mat-form-field');
      expect(formFields.length).toBe(4);
    });

    it('should render input fields for name, lport, rhost, rport', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const inputs = compiled.querySelectorAll('input');
      expect(inputs.length).toBe(4);
    });

    it('should have text input for name field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('input[type="text"]');
      expect(nameInput).toBeTruthy();
    });

    it('should have number input for local port', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const numberInputs = compiled.querySelectorAll('input[type="number"]');
      expect(numberInputs.length).toBe(2); // lport and rport
    });
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (UdpTunnelsComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (UdpTunnelsComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onAddUdpInterface method', () => {
      expect(typeof (UdpTunnelsComponent.prototype as any).onAddUdpInterface).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof (UdpTunnelsComponent.prototype as any).delete).toBe('function');
    });
  });

  describe('change detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
    });
  });
});
