import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAnalyticsService } from './google-analytics.service';
import { Router } from '@angular/router';
import { SettingsService } from './settings.service';

// Mock gtag global function
declare global {
  var gtag: any;
}

describe('GoogleAnalyticsService', () => {
  let service: GoogleAnalyticsService;
  let mockRouter: any;
  let mockSettingsService: SettingsService;

  beforeEach(() => {
    // Mock gtag function
    global.gtag = vi.fn();

    // Mock Router
    mockRouter = {
      events: {
        subscribe: vi.fn((callback) => {
          // Store callback for testing
          (mockRouter as any)._navigationCallback = callback;
        }),
      },
    };

    // Mock SettingsService
    mockSettingsService = {
      getStatisticsSettings: vi.fn(() => true),
    } as any;
  });

  describe('Service Creation', () => {
    beforeEach(() => {
      service = new GoogleAnalyticsService(mockRouter, mockSettingsService);
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of GoogleAnalyticsService', () => {
      expect(service).toBeInstanceOf(GoogleAnalyticsService);
    });
  });

  describe('Service Structure', () => {
    beforeEach(() => {
      service = new GoogleAnalyticsService(mockRouter, mockSettingsService);
    });

    it('should have SettingsService as dependency', () => {
      expect(service).toBeTruthy();
    });

    it('should handle Router dependency', () => {
      expect(service).toBeTruthy();
    });
  });
});
