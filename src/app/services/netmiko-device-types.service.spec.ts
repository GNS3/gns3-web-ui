import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';
import { NetmikoDeviceTypesService } from './netmiko-device-types.service';

describe('NetmikoDeviceTypesService', () => {
  let service: NetmikoDeviceTypesService;
  let httpController: { get: ReturnType<typeof vi.fn> };
  let controller: Controller;

  beforeEach(() => {
    httpController = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: HttpController, useValue: httpController }],
    });
    service = TestBed.inject(NetmikoDeviceTypesService);
    controller = { id: 1 } as Controller;
    vi.clearAllMocks();
  });

  it('maps the response device_types / netmiko_version', () => {
    httpController.get.mockReturnValue(
      of({
        netmiko_version: '4.7.0',
        device_types: [
          { name: 'cisco_ios', telnet: false, custom: false },
          { name: 'gns3_vpcs_telnet', telnet: true, custom: true },
        ],
      })
    );

    let result: { deviceTypes: unknown; netmikoVersion: unknown } | undefined;
    service.getDeviceTypes(controller).subscribe((r) => (result = r));

    expect(httpController.get).toHaveBeenCalledWith(controller, '/netmiko/device_types');
    expect(result!.deviceTypes).toHaveLength(2);
    expect(result!.netmikoVersion).toBe('4.7.0');
  });

  it('falls back to null device types on 501 (netmiko missing) or any error', () => {
    httpController.get.mockReturnValue(throwError(() => new Error('501 Netmiko is not available')));

    let result: { deviceTypes: unknown; netmikoVersion: unknown } | undefined;
    service.getDeviceTypes(controller).subscribe((r) => (result = r));

    expect(result!.deviceTypes).toBeNull();
    expect(result!.netmikoVersion).toBeNull();
  });

  it('caches per controller — second call does not hit the server again', () => {
    httpController.get.mockReturnValue(of({ netmiko_version: '4.7.0', device_types: [] }));

    service.getDeviceTypes(controller).subscribe();
    service.getDeviceTypes(controller).subscribe();

    expect(httpController.get).toHaveBeenCalledTimes(1);

    // a different controller is a different cache entry
    service.getDeviceTypes({ id: 2 } as Controller).subscribe();
    expect(httpController.get).toHaveBeenCalledTimes(2);
  });
});
