import { describe, expect, it } from 'vitest';
import { startupMediaProfileDeviceType, startupMediaProfileToSave } from '@models/startup-media-profile';

describe('startupMediaProfileDeviceType', () => {
  it('knows the shipped profiles before the catalog is fetched', () => {
    expect(startupMediaProfileDeviceType('cisco-c8000v-autonomous')).toBe('cisco_ios_telnet');
    expect(startupMediaProfileDeviceType('cisco-viptela')).toBe('cisco_viptela');
    expect(startupMediaProfileDeviceType('cisco-asav')).toBe('cisco_asa');
    expect(startupMediaProfileDeviceType('cisco-nxosv9k')).toBe('cisco_nxos');
    expect(startupMediaProfileDeviceType('cisco-iosxrv9k')).toBe('cisco_xr');
    expect(startupMediaProfileDeviceType('cisco-cat9kv')).toBe('cisco_ios_telnet');
    expect(startupMediaProfileDeviceType('juniper-vsrx')).toBe('juniper_junos');
    expect(startupMediaProfileDeviceType('arista-veos')).toBe('arista_eos');
    expect(startupMediaProfileDeviceType('paloalto-panos')).toBe('paloalto_panos');
    expect(startupMediaProfileDeviceType('cisco-iosv')).toBe('cisco_ios_telnet');
    expect(startupMediaProfileDeviceType('nope')).toBeUndefined();
    expect(startupMediaProfileDeviceType('')).toBeUndefined();
    expect(startupMediaProfileDeviceType(null)).toBeUndefined();
  });

  it('learns the profiles of a newer server from the fetched catalog, which wins over this build', () => {
    const lookup = (id: string) => ({ 'vendor-x': 'vendor_x_cli', 'cisco-viptela': 'cisco_viptela_v2' })[id];
    expect(startupMediaProfileDeviceType('vendor-x', lookup)).toBe('vendor_x_cli');
    expect(startupMediaProfileDeviceType('cisco-viptela', lookup)).toBe('cisco_viptela_v2');
    expect(startupMediaProfileDeviceType('no-type', lookup)).toBeUndefined();
    expect(startupMediaProfileDeviceType('cisco-c8000v-controller', lookup)).toBe('cisco_ios_telnet');
  });
});

describe('startupMediaProfileToSave', () => {
  it('leaves the property untouched when it never had a profile and still has none', () => {
    expect(startupMediaProfileToSave('', undefined)).toBeUndefined();
    expect(startupMediaProfileToSave('  ', null)).toBeUndefined();
  });

  it('sends the chosen profile, trimmed', () => {
    expect(startupMediaProfileToSave(' cisco-viptela ', undefined)).toBe('cisco-viptela');
  });

  it('sends null to clear a profile that was set', () => {
    expect(startupMediaProfileToSave('', 'cisco-viptela')).toBeNull();
  });
});
