import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdatesService } from './updates.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';

describe('UpdatesService', () => {
  let service: UpdatesService;
  let mockHttpClient: Partial<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of({})),
    };

    service = new UpdatesService(mockHttpClient as HttpClient);
  });

  describe('getLatestVersion', () => {
    it('should call httpClient.get with correct URL', () => {
      (mockHttpClient.get as any).mockReturnValue(of({ version: '3.0.0' }));

      service.getLatestVersion();

      expect(mockHttpClient.get).toHaveBeenCalledWith('http://update.gns3.net/');
    });

    it('should return Observable that emits version data', async () => {
      const mockResponse = { version: '3.1.0', date: '2026-01-01' };
      (mockHttpClient.get as any).mockReturnValue(of(mockResponse));

      const result = await firstValueFrom(service.getLatestVersion());

      expect(result).toEqual(mockResponse);
    });

    it('should emit null when server returns null', async () => {
      (mockHttpClient.get as any).mockReturnValue(of(null));

      const result = await firstValueFrom(service.getLatestVersion());

      expect(result).toBeNull();
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('Network error');
      (mockHttpClient.get as any).mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getLatestVersion())).rejects.toThrow('Network error');
    });

    it('should propagate HTTP 404 error', async () => {
      const notFoundError = new Error('Http failure response: 404');
      (mockHttpClient.get as any).mockReturnValue(throwError(() => notFoundError));

      await expect(firstValueFrom(service.getLatestVersion())).rejects.toThrow();
    });

    it('should return correct version string', async () => {
      const mockResponse = { version: '3.0.0', date: '2025-12-01' };
      (mockHttpClient.get as any).mockReturnValue(of(mockResponse));

      const result = (await firstValueFrom(service.getLatestVersion())) as { version: string };

      expect(result.version).toBe('3.0.0');
    });

    it('should return correct version string for newer version', async () => {
      const mockResponse = { version: '3.2.0', date: '2026-03-15' };
      (mockHttpClient.get as any).mockReturnValue(of(mockResponse));

      const result = (await firstValueFrom(service.getLatestVersion())) as { version: string };

      expect(result.version).toBe('3.2.0');
    });
  });
});
