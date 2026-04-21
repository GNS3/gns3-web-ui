import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { VncConsoleService } from './vnc-console.service';
import { ToasterService } from './toaster.service';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
  },
}));

describe('VncConsoleService', () => {
  let service: VncConsoleService;
  let mockToasterService: any;
  let mockNode: Node;
  let mockController: Controller;
  let originalWindow: typeof window;

  beforeEach(() => {
    vi.clearAllMocks();
    originalWindow = global.window;

    mockToasterService = {
      error: vi.fn(),
    };

    mockNode = {
      node_id: 'node-1',
      name: 'Test VNC Node',
      project_id: 'project-1',
      console_type: 'vnc',
      status: 'started',
      properties: {},
    } as Node;

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as any,
      status: 'running' as any,
      authToken: 'test-token',
    } as Controller;

    global.window = {
      open: vi.fn(() => ({
        closed: false,
      })),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        VncConsoleService,
        { provide: ToasterService, useValue: mockToasterService },
      ],
    });

    service = TestBed.inject(VncConsoleService);
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VncConsoleService', () => {
      expect(service).toBeInstanceOf(VncConsoleService);
    });
  });

  describe('buildVncWebSocketUrl', () => {
    it('should return ws URL for http protocol', () => {
      const url = service.buildVncWebSocketUrl(mockController, mockNode);

      expect(url).toContain('ws://');
      expect(url).toContain('localhost:3080');
      expect(url).toContain('/projects/project-1/nodes/node-1/console/vnc');
      expect(url).toContain('token=test-token');
    });

    it('should return wss URL for https protocol', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      const url = service.buildVncWebSocketUrl(httpsController, mockNode);

      expect(url).toContain('wss://');
    });

    it('should include version in path', () => {
      const url = service.buildVncWebSocketUrl(mockController, mockNode);

      expect(url).toContain('/v3/');
    });

    it('should handle null authToken', () => {
      const controllerWithNullToken = { ...mockController, authToken: null as any };
      const url = service.buildVncWebSocketUrl(controllerWithNullToken, mockNode);

      expect(url).toContain('token=null');
    });
  });

  describe('buildVncConsolePageUrl', () => {
    it('should return path to VNC console HTML page', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('/assets/vnc-console/index.html?');
    });

    it.each([
      { param: 'ws_url=', expected: 'ws%3A%2F%2F' },
      { param: 'node_name=', expected: 'Test+VNC+Node' },
      { param: 'node_id=', expected: 'node-1' },
      { param: 'project_id=', expected: 'project-1' },
      { param: 'autoconnect=', expected: '1' },
    ])('should include $param parameter', ({ param, expected }) => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain(param);
      expect(url).toContain(expected);
    });
  });

  describe('openVncConsole', () => {
    it('should open console for started vnc node', () => {
      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should show error for stopped node', () => {
      mockNode.status = 'stopped';

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Node must be started before opening console');
    });

    it('should show error for non-vnc console type', () => {
      mockNode.console_type = 'telnet';

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Node console type is telnet, not vnc');
    });

    it('should open in new tab when inNewTab is true', () => {
      service.openVncConsole(mockController, mockNode, true);

      expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank');
    });

    it('should open in popup window with default size when inNewTab is false', () => {
      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).toHaveBeenCalledWith(
        expect.any(String),
        'VNC-Test VNC Node',
        expect.stringContaining('width=1034')
      );
      expect(window.open).toHaveBeenCalledWith(
        expect.any(String),
        'VNC-Test VNC Node',
        expect.stringContaining('height=778')
      );
    });

    it('should use custom resolution from properties', () => {
      mockNode.properties = {
        console_resolution: '1280x720',
      } as any;

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).toHaveBeenCalledWith(
        expect.any(String),
        'VNC-Test VNC Node',
        expect.stringContaining('width=1290')
      );
      expect(window.open).toHaveBeenCalledWith(
        expect.any(String),
        'VNC-Test VNC Node',
        expect.stringContaining('height=730')
      );
    });

    it('should handle null properties gracefully', () => {
      mockNode.properties = null;

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should handle invalid resolution format in properties', () => {
      mockNode.properties = {
        console_resolution: 'invalid',
      } as any;

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should show error when popup is blocked', () => {
      (window.open as any).mockReturnValue(null);

      service.openVncConsole(mockController, mockNode, false);

      expect(mockToasterService.error).toHaveBeenCalledWith('Popup was blocked. Please allow popups for this site.');
    });

    it('should handle errors gracefully', () => {
      (window.open as any).mockImplementation(() => {
        throw new Error('Test error');
      });

      service.openVncConsole(mockController, mockNode, false);

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to open VNC console: Test error');
    });
  });
});
