import { describe, expect, it } from 'vitest';
import { qemuImagePath, isAvailableIsoImage } from './qemu-image';

describe('qemuImagePath', () => {
  it('retains subfolders and the ISO extension case', () => {
    expect(
      qemuImagePath({
        path: '/images/QEMU/installers/linux.ISO',
        reference: 'installers/linux.ISO',
        filename: 'linux.ISO',
      })
    ).toBe('installers/linux.ISO');
  });

  it('does not guess the image root from directory names', () => {
    expect(
      qemuImagePath({ path: '/srv/QEMU/images/QEMU/linux.iso', reference: 'linux.iso', filename: 'linux.iso' })
    ).toBe('linux.iso');
    expect(qemuImagePath({ path: '/extra/QEMU/linux.iso', filename: 'linux.iso' })).toBe('/extra/QEMU/linux.iso');
  });

  it('preserves references outside the standard QEMU directory', () => {
    expect(qemuImagePath({ path: '/other/images/linux.iso', filename: 'linux.iso' })).toBe('/other/images/linux.iso');
    expect(qemuImagePath({ filename: 'linux.iso' })).toBe('linux.iso');
  });
});

describe('isAvailableIsoImage', () => {
  it.each(['missing', 'unavailable', 'invalid'] as const)('excludes %s inventory entries', (availability) => {
    expect(isAvailableIsoImage({ filename: 'installer.iso', availability })).toBe(false);
  });

  it.each([undefined, 'unknown', 'available'] as const)('allows %s ISO entries', (availability) => {
    expect(isAvailableIsoImage({ filename: 'installer.ISO', availability })).toBe(true);
  });

  it('excludes non-QEMU files with an ISO filename', () => {
    expect(isAvailableIsoImage({ filename: 'router.iso', availability: 'available', image_type: 'iou' })).toBe(false);
  });

  it('excludes hard disk images', () => {
    expect(isAvailableIsoImage({ filename: 'disk.qcow2', availability: 'available' })).toBe(false);
  });
});
