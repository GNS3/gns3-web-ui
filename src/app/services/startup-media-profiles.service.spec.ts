import { TestBed } from '@angular/core/testing';
import { Controller } from '@models/controller';
import { computed } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpController } from './http-controller.service';
import { normalizeStartupMediaProfiles, StartupMediaProfilesService } from './startup-media-profiles.service';

const catalog = [
  { id: 'cisco-viptela', title: 'Cisco Viptela', device_type: 'cisco_viptela', description: 'NoCloud seed' },
];

describe('StartupMediaProfilesService', () => {
  let service: StartupMediaProfilesService;
  const http = { get: vi.fn() };
  const first = { id: 1 } as Controller;
  const second = { id: 2 } as Controller;

  beforeEach(() => {
    http.get.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: HttpController, useValue: http }] });
    service = TestBed.inject(StartupMediaProfilesService);
  });

  it('reads the catalog from the controller', async () => {
    http.get.mockReturnValue(of(catalog));
    expect(await firstValueFrom(service.list(first))).toEqual(catalog);
    expect(http.get).toHaveBeenCalledWith(first, '/startup-media-profiles');
  });

  it('keeps reactive catalog lookups isolated by controller', async () => {
    const profile = { id: 'vendor-x', title: 'X', device_type: 'vendor_x_cli', description: '' };
    http.get.mockReturnValueOnce(of([profile])).mockReturnValueOnce(of([{ ...profile, device_type: 'other_cli' }]));
    const firstType = computed(() => service.deviceType(first, profile.id));
    expect(firstType()).toBeUndefined();
    await firstValueFrom(service.list(first));
    await firstValueFrom(service.list(second));
    expect(firstType()).toBe('vendor_x_cli');
    expect(service.deviceType(second, profile.id)).toBe('other_cli');
  });

  it('fetches once per controller', async () => {
    http.get.mockReturnValue(of(catalog));
    await firstValueFrom(service.list(first));
    await firstValueFrom(service.list(first));
    await firstValueFrom(service.list(second));
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failure, so the next call retries', async () => {
    http.get.mockReturnValueOnce(throwError(() => new Error('down'))).mockReturnValueOnce(of(catalog));
    await expect(firstValueFrom(service.list(first))).rejects.toThrow('down');
    expect(await firstValueFrom(service.list(first))).toEqual(catalog);
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});

describe('normalizeStartupMediaProfiles', () => {
  it('keeps well-formed entries, fills missing text and drops junk', () => {
    expect(normalizeStartupMediaProfiles([{ id: 'x' }, null, { title: 'no id' }, { id: 5 }, ...catalog])).toEqual([
      { id: 'x', title: 'x', device_type: '', description: '' },
      ...catalog,
    ]);
    expect(normalizeStartupMediaProfiles('nope')).toEqual([]);
  });
});
