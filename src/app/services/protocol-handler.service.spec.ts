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
    mockToasterService = {
      error: vi.fn(),
    };

    mockDeviceService = {
      getDeviceInfo: vi.fn(() => ({
        browser: 'Chrome',
        os: 'Windows',
        deviceType: 'desktop',
      })),
    };

    mockLoginService = {};

    console.log = vi.fn();

    vi.stubGlobal('location', {
      assign: vi.fn(),
    });

    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        const element = {
          tagName: tagName.toUpperCase(),
          id: '',
          src: '',
          style: { display: '' },
          appendChild: vi.fn(),
          querySelector: vi.fn(),
          parentNode: null,
          removeChild: vi.fn(),
        } as unknown as Element;

        if (tagName.toLowerCase() === 'iframe') {
          Object.defineProperty(element, 'contentWindow', {
            value: {
              location: {
                href: '',
                set href(val: string) { (element as HTMLIFrameElement & { _href: string })._href = val; },
                get href() { return (element as HTMLIFrameElement & { _href: string })._href; },
              },
            },
            configurable: true,
          });
        }
        return element as Element;
      }),
      querySelector: vi.fn(),
      body: {
        appendChild: vi.fn(),
        querySelector: vi.fn(),
      },
    });

    service = new ProtocolHandlerService(
      mockToasterService,
      mockDeviceService,
      mockLoginService
    );
  });

  describe('Service Creation', () => {
    it('should be instantiable with dependencies', () => {
      expect(service).toBeTruthy();
      expect(service).toBeInstanceOf(ProtocolHandlerService);
    });
  });

  describe('createHiddenIframe', () => {
    let mockTarget: Element;
    let createElementSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createElementSpy = vi.fn((tagName: string) => {
        const element = {
          tagName: tagName.toUpperCase(),
          id: '',
          src: '',
          style: { display: '' },
          appendChild: vi.fn(),
          parentNode: null,
          removeChild: vi.fn(),
          querySelector: vi.fn(),
        };
        if (tagName.toLowerCase() === 'iframe') {
          Object.defineProperty(element, 'contentWindow', {
            value: { location: { href: '', set href(val: string) {} } },
            configurable: true,
          });
        }
        return element;
      });

      mockTarget = {
        appendChild: vi.fn(),
        querySelector: vi.fn(),
        tagName: 'DIV',
      } as unknown as Element;

      vi.stubGlobal('document', {
        createElement: createElementSpy,
        querySelector: vi.fn(),
        body: { appendChild: vi.fn() },
      });
    });

    it('should create an iframe element', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect(createElementSpy).toHaveBeenCalledWith('iframe');
      expect(iframe).toBeTruthy();
    });

    it('should set iframe src correctly', () => {
      const testUri = 'gns3://test';
      const iframe = service.createHiddenIframe(mockTarget, testUri);

      expect((iframe as HTMLIFrameElement).src).toBe(testUri);
    });

    it('should set iframe id to hiddenIframe', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect((iframe as HTMLIFrameElement).id).toBe('hiddenIframe');
    });

    it('should set iframe display to none', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect((iframe as HTMLIFrameElement).style.display).toBe('none');
    });

    it('should append iframe to target element', () => {
      service.createHiddenIframe(mockTarget, 'about:blank');

      expect(mockTarget.appendChild).toHaveBeenCalled();
    });

    it('should return the created iframe', () => {
      const iframe = service.createHiddenIframe(mockTarget, 'about:blank');

      expect(iframe.tagName).toBe('IFRAME');
    });
  });

  describe('openUriUsingFirefox', () => {
    let mockIframe: any;
    let createElementSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockIframe = {
        id: 'hiddenIframe',
        style: { display: 'none' },
        contentWindow: {
          location: {
            href: '',
            set href(val: string) { mockIframe.contentWindow.location._href = val; },
            get href() { return mockIframe.contentWindow.location._href; },
            _href: '',
          },
        },
      };

      createElementSpy = vi.fn(() => mockIframe);

      vi.stubGlobal('document', {
        createElement: createElementSpy,
        querySelector: vi.fn(() => mockIframe),
        body: { appendChild: vi.fn() },
      });
    });

    it('should find existing iframe', () => {
      const querySelectorSpy = vi.spyOn(document, 'querySelector');

      service.openUriUsingFirefox('gns3://test');

      expect(querySelectorSpy).toHaveBeenCalledWith('#hiddenIframe');
    });

    it('should create new iframe if none exists', () => {
      vi.spyOn(document, 'querySelector').mockReturnValueOnce(null);

      service.openUriUsingFirefox('gns3://test');

      expect(createElementSpy).toHaveBeenCalledWith('iframe');
    });

    it('should set iframe location href', () => {
      const testUri = 'gns3://test-uri';

      service.openUriUsingFirefox(testUri);

      expect(mockIframe.contentWindow.location.href).toBe(testUri);
    });

    it('should show error toast for unknown protocol error', () => {
      Object.defineProperty(mockIframe.contentWindow.location, 'href', {
        set: () => {
          throw { name: 'NS_ERROR_UNKNOWN_PROTOCOL' };
        },
      });

      service.openUriUsingFirefox('unknown://test');

      expect(mockToasterService.error).toHaveBeenCalledWith('Protocol handler does not exist');
    });

    it('should not show error for other exceptions', () => {
      Object.defineProperty(mockIframe.contentWindow.location, 'href', {
        set: () => {
          throw { name: 'OTHER_ERROR' };
        },
      });

      service.openUriUsingFirefox('gns3://test');

      expect(mockToasterService.error).not.toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('should log the launch message with browser and URI', async () => {
      await service.open('gns3://test');

      expect(console.log).toHaveBeenCalledWith(
        'Launching external protocol handler with Chrome: gns3://test'
      );
    });

    it('should get device info', async () => {
      await service.open('gns3://test');

      expect(mockDeviceService.getDeviceInfo).toHaveBeenCalled();
    });

    it('should use openUriUsingFirefox for Firefox browser', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Firefox',
        os: 'Linux',
      }));

      const openUriUsingFirefoxSpy = vi.spyOn(service, 'openUriUsingFirefox');

      await service.open('gns3://test');

      expect(openUriUsingFirefoxSpy).toHaveBeenCalledWith('gns3://test');
    });

    it('should use location.assign for Chrome browser', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Chrome',
        os: 'Windows',
      }));

      await service.open('gns3://test');

      expect(location.assign).toHaveBeenCalledWith('gns3://test');
    });
  });

  describe('Edge Cases', () => {
    it.each([
      ['empty string', ''],
      ['special characters', 'gns3://test?param=value&other=123'],
      ['very long URI', 'gns3://test?' + 'param=' + 'x'.repeat(1000)],
    ])('should pass URI with %s to location.assign', async (desc, uri) => {
      await service.open(uri);
      expect(location.assign).toHaveBeenCalledWith(uri);
    });

    it.each(['Chrome', 'Safari', 'Edge', 'Opera'])('should not throw for browser %s', async (browser) => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({ browser, os: 'Windows' }));
      await expect(service.open('gns3://test')).resolves.toBeUndefined();
    });
  });

  describe('Browser Detection', () => {
    it('should use openUriUsingFirefox for Firefox', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Firefox',
        os: 'Linux',
      }));

      const spy = vi.spyOn(service, 'openUriUsingFirefox');

      await service.open('gns3://test');

      expect(spy).toHaveBeenCalledWith('gns3://test');
    });

    it('should not call location.assign for Firefox', async () => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser: 'Firefox',
        os: 'Linux',
      }));

      await service.open('gns3://test');

      expect(location.assign).not.toHaveBeenCalled();
    });

    it.each(['Chrome', 'MSIE', 'Edge', 'Opera'])('should use location.assign for %s', async (browser) => {
      mockDeviceService.getDeviceInfo = vi.fn(() => ({
        browser,
        os: 'Windows',
      }));

      await service.open('gns3://test');

      expect(location.assign).toHaveBeenCalledWith('gns3://test');
    });
  });
});
