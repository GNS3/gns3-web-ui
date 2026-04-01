import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { VersionService } from './version.service';
import { Controller } from '@models/controller';
import { Version } from '@models/version';

describe('VersionService', () => {
  let service: VersionService;
  let httpControllerSpy: any;

  beforeEach(() => {
    httpControllerSpy = {
      get: vi.fn(),
    };
    service = new VersionService(httpControllerSpy);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should get version from controller', async () => {
    const mockController: Controller = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      authToken: '',
      location: 'local',
      path: '',
      ubridge_path: '',
      status: 'stopped',
      username: '',
      password: '',
      tokenExpired: false,
    };

    const mockVersion: Version = {
      version: '3.1.0',
    };

    httpControllerSpy.get.mockReturnValue(of(mockVersion));

    const result = await new Promise<Version>((resolve) => {
      service.get(mockController).subscribe((version) => resolve(version));
    });

    expect(result).toEqual(mockVersion);
    expect(httpControllerSpy.get).toHaveBeenCalledWith(mockController, '/version');
  });

  it('should handle errors when getting version', async () => {
    const mockController: Controller = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      authToken: '',
      location: 'local',
      path: '',
      ubridge_path: '',
      status: 'stopped',
      username: '',
      password: '',
      tokenExpired: false,
    };

    const error = new Error('Network error');
    httpControllerSpy.get.mockReturnValue(throwError(() => error));

    await expect(
      new Promise<Version>((_, reject) => {
        service.get(mockController).subscribe({
          next: () => reject(new Error('Should not succeed')),
          error: reject,
        });
      })
    ).rejects.toThrow('Network error');
  });
});
