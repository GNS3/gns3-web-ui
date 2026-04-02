import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdatesService } from './updates.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

describe('UpdatesService', () => {
  let service: UpdatesService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
    };

    service = new UpdatesService(mockHttpClient);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of UpdatesService', () => {
      expect(service).toBeInstanceOf(UpdatesService);
    });
  });

  describe('getLatestVersion', () => {
    it('should call httpClient.get with correct URL', () => {
      mockHttpClient.get.mockReturnValue(of({ version: '3.0.0' }));

      service.getLatestVersion();

      expect(mockHttpClient.get).toHaveBeenCalledWith('http://update.gns3.net/');
    });

    it('should return Observable', () => {
      mockHttpClient.get.mockReturnValue(of({ version: '3.0.0' }));

      const result = service.getLatestVersion();

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle version response', async () => {
      const mockResponse = { version: '3.1.0', date: '2026-01-01' };
      mockHttpClient.get.mockReturnValue(of(mockResponse));

      const result = await new Promise((resolve) => {
        service.getLatestVersion().subscribe((data) => resolve(data));
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle empty response', () => {
      mockHttpClient.get.mockReturnValue(of(null));

      const result = service.getLatestVersion();

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
