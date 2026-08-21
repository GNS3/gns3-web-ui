import { describe, expect, it } from 'vitest';
import { ApplianceMetadata } from '@models/appliance-metadata';
import { applianceCredentialValue, setApplianceCredential } from './appliance-metadata-field';

/** Field-level updates behind the template details General settings credential inputs. */
describe('appliance-metadata-field', () => {
  it('reads null/absent credentials as empty strings', () => {
    expect(applianceCredentialValue(null, 'default_username')).toBe('');
    expect(applianceCredentialValue({ default_username: null }, 'default_username')).toBe('');
    expect(applianceCredentialValue({}, 'default_password')).toBe('');
    expect(applianceCredentialValue({ default_username: 'vyos' }, 'default_username')).toBe('vyos');
  });

  it('sets the one key and preserves everything else', () => {
    const current: ApplianceMetadata = { vendor_name: 'Vendor', appliance_id: 'abc', default_password: 's3cret' };

    const next = setApplianceCredential(current, 'default_username', 'root')!;
    expect(next['default_username']).toBe('root');
    expect(next['vendor_name']).toBe('Vendor');
    expect(next['appliance_id']).toBe('abc');
    expect(next['default_password']).toBe('s3cret');
    expect(current['default_username']).toBeUndefined(); // input not mutated
  });

  it('drops the key when the value is empty', () => {
    const next = setApplianceCredential({ default_username: 'root', vendor_name: 'Vendor' }, 'default_username', '  ')!;

    expect(next['default_username']).toBeUndefined();
    expect(next['vendor_name']).toBe('Vendor');
  });

  it('yields null when clearing the last key (PUT null semantics)', () => {
    expect(setApplianceCredential({ default_username: 'root' }, 'default_username', '')).toBeNull();
    expect(setApplianceCredential(null, 'default_password', '')).toBeNull();
  });
});
