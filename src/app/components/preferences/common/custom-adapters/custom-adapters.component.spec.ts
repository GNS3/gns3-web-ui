import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { CustomAdaptersComponent, CustomAdaptersDialogData, CustomAdaptersDialogResult, NetworkType } from './custom-adapters.component';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CustomAdaptersComponent', () => {
  let component: CustomAdaptersComponent;
  let fixture: ComponentFixture<CustomAdaptersComponent>;
  let mockDialogRef: any;
  let mockToasterService: any;

  const networkTypes: NetworkType[] = [
    { value: 'e1000', name: 'E1000' },
    { value: 'virtio', name: 'Virtio' },
    { value: 'vmxnet3', name: 'VMXNET3' },
  ];

  const createMockData = (overrides: Partial<CustomAdaptersDialogData> = {}): CustomAdaptersDialogData => ({
    adapters: [],
    networkTypes: networkTypes,
    portNameFormat: 'Ethernet{0}',
    portSegmentSize: 0,
    defaultAdapterType: 'e1000',
    currentAdapters: 0,
    ...overrides,
  });

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CustomAdaptersComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: createMockData() },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();
  });

  const createComponent = (data: CustomAdaptersDialogData) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CustomAdaptersComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomAdaptersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create', () => {
      createComponent(createMockData());
      expect(component).toBeTruthy();
    });

    it('should initialize adapters from data', () => {
      const existingAdapters: CustomAdapter[] = [
        { adapter_number: 0, adapter_type: 'e1000', port_name: 'Ethernet0', mac_address: '' },
        { adapter_number: 1, adapter_type: 'virtio', port_name: 'Ethernet1', mac_address: '' },
      ];
      createComponent(createMockData({ adapters: existingAdapters }));
      expect(component.adapters.length).toBe(2);
      expect(component.adapters[0].port_name).toBe('Ethernet0');
    });

    it('should return networkTypes from data', () => {
      createComponent(createMockData());
      expect(component.networkTypes).toEqual(networkTypes);
    });

    it('should return empty array when networkTypes is not provided', () => {
      createComponent(createMockData({ networkTypes: undefined as any }));
      expect(component.networkTypes).toEqual([]);
    });
  });

  describe('onAdd', () => {
    it('should add adapter with incrementing adapter_number', () => {
      createComponent(createMockData());
      component.onAdd();

      expect(component.adapters.length).toBe(1);
      expect(component.adapters[0].adapter_number).toBe(0);
      expect(component.adapters[0].adapter_type).toBe('e1000');
      expect(component.adapters[0].port_name).toBe('Ethernet0');
      expect(component.adapters[0].mac_address).toBe('');
    });

    it('should add multiple adapters with sequential numbers', () => {
      createComponent(createMockData());
      component.onAdd();
      component.onAdd();
      component.onAdd();

      expect(component.adapters.length).toBe(3);
      expect(component.adapters[0].adapter_number).toBe(0);
      expect(component.adapters[1].adapter_number).toBe(1);
      expect(component.adapters[2].adapter_number).toBe(2);
    });

    it('should use first networkType value as default adapter_type', () => {
      createComponent(createMockData({ networkTypes }));
      component.onAdd();

      expect(component.adapters[0].adapter_type).toBe('e1000');
    });

    it('should generate port name based on portNameFormat', () => {
      createComponent(createMockData({ portNameFormat: 'eth{0}' }));
      component.onAdd();
      component.onAdd();

      expect(component.adapters[0].port_name).toBe('eth0');
      expect(component.adapters[1].port_name).toBe('eth1');
    });

    it('should handle portSegmentSize for port name generation', () => {
      createComponent(createMockData({ portNameFormat: 'eth{0}', portSegmentSize: 2 }));
      component.onAdd();
      component.onAdd();
      component.onAdd();
      component.onAdd();

      expect(component.adapters[0].port_name).toBe('eth0');
      expect(component.adapters[1].port_name).toBe('eth1');
      expect(component.adapters[2].port_name).toBe('eth2');
      expect(component.adapters[3].port_name).toBe('eth3');
    });

    it('should continue numbering after highest existing adapter_number', () => {
      const existingAdapters: CustomAdapter[] = [
        { adapter_number: 5, adapter_type: 'e1000', port_name: 'eth5' },
      ];
      createComponent(createMockData({ adapters: existingAdapters }));
      component.onAdd();

      expect(component.adapters.length).toBe(2);
      expect(component.adapters[1].adapter_number).toBe(6);
    });
  });

  describe('delete', () => {
    it('should remove adapter from list', () => {
      createComponent(createMockData());
      component.onAdd();
      component.onAdd();
      const adapterToDelete = component.adapters[0];

      component.delete(adapterToDelete);

      expect(component.adapters.length).toBe(1);
      expect(component.adapters).not.toContain(adapterToDelete);
    });

    it('should not affect other adapters when deleting one', () => {
      createComponent(createMockData());
      component.onAdd();
      component.onAdd();
      const adapterToDelete = component.adapters[0];

      component.delete(adapterToDelete);

      expect(component.adapters[0].adapter_number).toBe(1);
    });

    it('should do nothing when deleting non-existent adapter', () => {
      createComponent(createMockData());
      component.onAdd();
      const nonExistentAdapter = { adapter_number: 99, adapter_type: 'e1000', port_name: 'eth99' };

      component.delete(nonExistentAdapter as CustomAdapter);

      expect(component.adapters.length).toBe(1);
    });
  });

  describe('MAC address validation', () => {
    describe('formatMacAddress', () => {
      it('should return empty string for empty input', () => {
        createComponent(createMockData());
        expect(component.formatMacAddress('')).toBe('');
      });

      it('should return original for null/undefined', () => {
        createComponent(createMockData());
        expect(component.formatMacAddress('')).toBe('');
      });

      it('should format valid hex string to MAC format', () => {
        createComponent(createMockData());
        expect(component.formatMacAddress('aabbccddeeff')).toBe('aa:bb:cc:dd:ee:ff');
      });

      it('should handle mixed case hex', () => {
        createComponent(createMockData());
        expect(component.formatMacAddress('AaBbCcDdEeFf')).toBe('Aa:Bb:Cc:Dd:Ee:Ff');
      });

      it('should strip non-hex characters before formatting', () => {
        createComponent(createMockData());
        expect(component.formatMacAddress('aa-bb-cc-dd-ee-ff')).toBe('aa:bb:cc:dd:ee:ff');
      });

      it('should return original if not 12 hex digits', () => {
        createComponent(createMockData());
        expect(component.formatMacAddress('aabbccddee')).toBe('aabbccddee');
      });
    });

    describe('isValidMacAddress', () => {
      it('should return true for empty MAC (optional field)', () => {
        createComponent(createMockData());
        expect(component.isValidMacAddress('')).toBe(true);
      });

      it('should return true for valid MAC format', () => {
        createComponent(createMockData());
        expect(component.isValidMacAddress('aa:bb:cc:dd:ee:ff')).toBe(true);
      });

      it('should return true for valid MAC with uppercase', () => {
        createComponent(createMockData());
        expect(component.isValidMacAddress('AA:BB:CC:DD:EE:FF')).toBe(true);
      });

      it('should return false for invalid MAC format', () => {
        createComponent(createMockData());
        expect(component.isValidMacAddress('aa:bb:cc:dd:ee')).toBe(false);
      });

      it('should return false for MAC with wrong separator', () => {
        createComponent(createMockData());
        expect(component.isValidMacAddress('aa-bb-cc-dd-ee-ff')).toBe(false);
      });
    });

    describe('hasInvalidMacAddresses', () => {
      it('should return false when all adapters have valid or empty MAC', () => {
        createComponent(createMockData());
        component.onAdd();
        component.adapters[0].mac_address = 'aa:bb:cc:dd:ee:ff';
        expect(component.hasInvalidMacAddresses()).toBe(false);
      });

      it('should return true when any adapter has invalid MAC', () => {
        createComponent(createMockData());
        component.onAdd();
        component.adapters[0].mac_address = 'invalid';
        expect(component.hasInvalidMacAddresses()).toBe(true);
      });

      it('should return false when no adapters have MAC set', () => {
        createComponent(createMockData());
        component.onAdd();
        component.adapters[0].mac_address = '';
        expect(component.hasInvalidMacAddresses()).toBe(false);
      });
    });

    describe('getMacErrorMessage', () => {
      it('should return space for empty MAC', () => {
        createComponent(createMockData());
        expect(component.getMacErrorMessage('')).toBe(' ');
      });

      it('should return invalid format message for empty cleaned MAC', () => {
        createComponent(createMockData());
        expect(component.getMacErrorMessage('@@@')).toBe('Invalid MAC address format');
      });

      it('should return too short message for MAC less than 12 hex digits', () => {
        createComponent(createMockData());
        expect(component.getMacErrorMessage('aabbccddee')).toBe('Too short (10/12 hex digits)');
      });

      it('should return too long message for MAC more than 12 hex digits', () => {
        createComponent(createMockData());
        expect(component.getMacErrorMessage('aabbccddeeffaa')).toBe('Too long (14/12 hex digits)');
      });

      it('should return invalid format for valid length but wrong format', () => {
        createComponent(createMockData());
        expect(component.getMacErrorMessage('aabbccddeeff')).toBe('Invalid MAC address format (12 hex digits required)');
      });
    });
  });

  describe('cancelConfigureCustomAdapters', () => {
    it('should close dialog without result', () => {
      createComponent(createMockData());
      component.cancelConfigureCustomAdapters();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('configureCustomAdapters', () => {
    it('should close dialog with empty adapters when no adapters exist', () => {
      createComponent(createMockData());
      component.configureCustomAdapters();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        adapters: [],
        requiredAdapters: 0,
      });
    });

    it('should show error when MAC address is invalid', () => {
      createComponent(createMockData());
      component.onAdd();
      component.adapters[0].mac_address = 'invalid';
      component.configureCustomAdapters();

      expect(mockToasterService.error).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not include adapters with default values when saving', () => {
      createComponent(createMockData({ defaultAdapterType: 'e1000', portNameFormat: 'Ethernet{0}' }));
      component.onAdd();
      component.configureCustomAdapters();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        adapters: [],
        requiredAdapters: 1,
      });
    });

    it('should include adapter when port_name differs from default', () => {
      createComponent(createMockData({ defaultAdapterType: 'e1000', portNameFormat: 'Ethernet{0}' }));
      component.onAdd();
      component.adapters[0].port_name = 'CustomName';
      component.configureCustomAdapters();

      const result = mockDialogRef.close.mock.calls[0][0] as CustomAdaptersDialogResult;
      expect(result.adapters.length).toBe(1);
      expect(result.adapters[0].port_name).toBe('CustomName');
    });

    it('should include adapter when adapter_type differs from default', () => {
      createComponent(createMockData({ defaultAdapterType: 'e1000' }));
      component.onAdd();
      component.adapters[0].adapter_type = 'virtio';
      component.configureCustomAdapters();

      const result = mockDialogRef.close.mock.calls[0][0] as CustomAdaptersDialogResult;
      expect(result.adapters.length).toBe(1);
      expect(result.adapters[0].adapter_type).toBe('virtio');
    });

    it('should include adapter when mac_address is set', () => {
      createComponent(createMockData({ defaultAdapterType: 'e1000' }));
      component.onAdd();
      component.adapters[0].mac_address = 'aa:bb:cc:dd:ee:ff';
      component.configureCustomAdapters();

      const result = mockDialogRef.close.mock.calls[0][0] as CustomAdaptersDialogResult;
      expect(result.adapters.length).toBe(1);
      expect(result.adapters[0].mac_address).toBe('aa:bb:cc:dd:ee:ff');
    });

    it('should set requiredAdapters to current adapter count', () => {
      createComponent(createMockData());
      component.onAdd();
      component.onAdd();
      component.onAdd();
      component.configureCustomAdapters();

      const result = mockDialogRef.close.mock.calls[0][0] as CustomAdaptersDialogResult;
      expect(result.requiredAdapters).toBe(3);
    });

    it('should handle segment size when calculating default port names', () => {
      createComponent(createMockData({ portNameFormat: 'eth{0}', portSegmentSize: 2, defaultAdapterType: 'e1000' }));
      component.onAdd();
      component.adapters[0].adapter_type = 'virtio';
      component.configureCustomAdapters();

      const result = mockDialogRef.close.mock.calls[0][0] as CustomAdaptersDialogResult;
      expect(result.adapters.length).toBe(1);
      expect(result.adapters[0].port_name).toBe('eth0');
    });

    it('should set mac_address to null when empty string', () => {
      createComponent(createMockData({ defaultAdapterType: 'e1000' }));
      component.onAdd();
      component.adapters[0].mac_address = '';
      component.adapters[0].adapter_type = 'virtio';
      component.configureCustomAdapters();

      const result = mockDialogRef.close.mock.calls[0][0] as CustomAdaptersDialogResult;
      expect(result.adapters[0].mac_address).toBeNull();
    });
  });
});
