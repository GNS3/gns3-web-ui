import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProtocolHandlerService } from './protocol-handler.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToasterService } from './toaster.service';
import { LoginService } from './login.service';

describe('ProtocolHandlerService', () => {
  let service: ProtocolHandlerService;
  let mockToasterService: any;
  let mockDeviceService: any;
  let mockLoginService: any;

  beforeEach(() => {
    // Mock ToasterService
    mockToasterService = {
      error: vi.fn(),
    };

    // Mock DeviceDetectorService
    mockDeviceService = {
      getDeviceInfo: vi.fn(() => ({
        browser: 'Chrome',
        os: 'Windows',
        deviceType: 'desktop',
      })),
    };

    // Mock LoginService
    mockLoginService = {
      // Add necessary methods
    };

    // Mock console.log
    console.log = vi.fn();

    // Mock location.assign
    vi.stubGlobal('location', {
      assign: vi.fn(),
    });

    service = new ProtocolHandlerService(
      mockToasterService,
      mockDeviceService,
      mockLoginService
    );
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ProtocolHandlerService', () => {
      expect(service).toBeInstanceOf(ProtocolHandlerService);
    });

    it('should have required dependencies', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('createHiddenIframe', () => {
    let mockTarget: Element;

    beforeEach(() => {
      // Create a mock target element
      mockTarget = document.createElement('div');
      document.body.appendChild(mockTarget);
    });

    afterEach(() => {
      // Clean up
      if (mockTarget && mockTarget.parentNode) {
        mockTarget.parentNode.removeChild(mockTarget);
      }
    });

    it('should create an iframe element', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect(iframe).toBeTruthy();
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('should set iframe src correctly', () => {
      const testUri = 'gns3://test';
      const iframe = service.createHiddenIframe(mockTarget, testUri);

      expect(iframe.src).toBe(testUri);
    });

    it('should set iframe id to hiddenIframe', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect(iframe.id).toBe('hiddenIframe');
    });

    it('should set iframe display to none', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect(iframe.style.display).toBe('none');
    });

    it('should append iframe to target element', () => {
      service.createHiddenIframe(mockTarget, 'about:blank');

      expect(mockTarget.querySelector('#hiddenIframe')).toBeTruthy();
    });

    it('should return the created iframe', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect(iframe).toBeInstanceOf(HTMLIFrameElement);
    });
  });

  describe('openUriUsingFirefox', () => {
    let mockIframe: HTMLIFrameElement;

    beforeEach(() => {
      // Create a mock iframe
      mockIframe = document.createElement('iframe');
      mockIframe.id = 'hiddenIframe';
      mockIframe.style.display = 'none';
      document.body.appendChild(mockIframe);

      // Mock contentWindow
      Object.defineProperty(mockIframe, 'contentWindow', {
        value: {
          location: {
            href: '',
          },
        },
        writable: true,
      });
    });

    afterEach(() => {
      // Clean up
      const existingIframe = document.querySelector('#hiddenIframe');
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }
    });

    it('should find existing iframe', () => {
      const querySelectorSpy = vi.spyOn(document, 'querySelector');

      service.openUriUsingFirefox('gns3://test');

      expect(querySelectorSpy).toHaveBeenCalledWith('#hiddenIframe');
    });

    it('should create new iframe if none exists', () => {
      // Remove existing iframe
      const existingIframe = document.querySelector('#hiddenIframe');
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      service.openUriUsingFirefox('gns3://test');

      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should set iframe location href', () => {
      const testUri = 'gns3://test-uri';

      service.openUriUsingFirefox(testUri);

      const iframe = document.querySelector('#hiddenIframe') as HTMLIFrameElement;
      expect(iframe?.contentWindow?.location?.href).toBe(testUri);
    });

    it('should show error toast for unknown protocol error', () => {
      // Mock iframe to throw error
      const iframe = document.querySelector('#hiddenIframe') as HTMLIFrameElement;
      Object.defineProperty(iframe.contentWindow.location, 'href', {
        set: () => {
          throw { name: 'NS_ERROR_UNKNOWN_PROTOCOL' };
        },
      });

      service.openUriUsingFirefox('unknown://test');

      expect(mockToasterService.error).toHaveBeenCalledWith('Protocol handler does not exist');
    });

    it('should not show error for other exceptions', () => {
      // Mock iframe to throw different error
      const iframe = document.querySelector('#hiddenIframe') as HTMLIFrameElement;
      Object.defineProperty(iframe.contentWindow.location, 'href', {
        set: () => {
          throw { name: 'OTHER_ERROR' };
        },
      });

      service.openUriUsingFirefox('gns3://test');

      expect(mockToasterService.error).not.toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('should log the launch message', async () => {
      await service.open('gns3://test');

      expect(console.log).toHaveBeenCalledWith(
        'Launching external protocol handler with Chrome: gns3://test'
      );
    });

    it('should get device info', async () => {
      await service.open('gns3://test');

      expect(mockDeviceService.getDeviceInfo).toHaveBeenCalled();
    });

    it('should use location.assign for non-Firefox browsers', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Chrome',
        os: 'Windows',
      }));

      await service.open('gns3://test');

      expect(location.assign).toHaveBeenCalledWith('gns3://test');
    });

    it('should use openUriUsingFirefox for Firefox', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Firefox',
        os: 'Linux',
      }));

      const openUriUsingFirefoxSpy = vi.spyOn(service, 'openUriUsingFirefox');

      await service.open('gns3://test');

      expect(openUriUsingFirefoxSpy).toHaveBeenCalledWith('gns3://test');
    });

    it('should not call location.assign for Firefox', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Firefox',
        os: 'Linux',
      }));

      const locationAssignSpy = vi.spyOn(location, 'assign');

      await service.open('gns3://test');

      expect(locationAssignSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty URI', async () => {
      await expect(service.open('')).resolves.toBeUndefined();
    });

    it('should handle URI with special characters', async () => {
      const specialUri = 'gns3://test?param=value&other=123';

      await expect(service.open(specialUri)).resolves.toBeUndefined();
    });

    it('should handle very long URIs', async () => {
      const longUri = 'gns3://test?' + 'param=' + 'x'.repeat(1000);

      await expect(service.open(longUri)).resolves.toBeUndefined();
    });

    it('should handle different browsers', async () => {
      const browsers = ['Chrome', 'Safari', 'Edge', 'Opera'];

      for (const browser of browsers) {
        mockDeviceService.getDeviceInfo = vi.fn(() => ({
          browser,
          os: 'Windows',
        }));

        await expect(service.open('gns3://test')).resolves.toBeUndefined();
      }
    });
  });

  describe('Browser Detection', () => {
    it('should handle Firefox browser', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Firefox',
        os: 'Linux',
      }));

      const spy = vi.spyOn(service, 'openUriUsingFirefox');

      await service.open('gns3://test');

      expect(spy).toHaveBeenCalled();
    });

    it('should handle Chrome browser', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Chrome',
        os: 'Windows',
      }));

      await service.open('gns3://test');

      expect(location.assign).toHaveBeenCalledWith('gns3://test');
    });

    it('should handle MSIE browser', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'MSIE',
        os: 'Windows',
      }));

      await service.open('gns3://test');

      expect(location.assign).toHaveBeenCalledWith('gns3://test');
    });

    it('should handle Edge browser', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Edge',
        os: 'Windows',
      }));

      await service.open('gns3://test');

      expect(location.assign).toHaveBeenCalledWith('gns3://test');
    });
  });
});
