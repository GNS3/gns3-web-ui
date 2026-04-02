import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  beforeEach(() => {
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
      protocol: 'http:',
      status: 'running',
      authToken: 'test-token',
    } as Controller;

    global.window = {
      open: vi.fn(() => ({
        closed: false,
      })),
    } as any;

    service = new VncConsoleService(mockToasterService);
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
      const httpsController = { ...mockController, protocol: 'https:' };
      const url = service.buildVncWebSocketUrl(httpsController, mockNode);

      expect(url).toContain('wss://');
    });

    it('should include version in path', () => {
      const url = service.buildVncWebSocketUrl(mockController, mockNode);

      expect(url).toContain('/3.0.0/');
    });
  });

  describe('buildVncConsolePageUrl', () => {
    it('should return path to VNC console HTML page', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('/assets/vnc-console/index.html?');
    });

    it('should include ws_url parameter', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('ws_url=');
      expect(url).toContain('ws%3A%2F%2F');
    });

    it('should include node_name parameter', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('node_name=Test+VNC+Node');
    });

    it('should include node_id parameter', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('node_id=node-1');
    });

    it('should include project_id parameter', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('project_id=project-1');
    });

    it('should include autoconnect parameter', () => {
      const url = service.buildVncConsolePageUrl(mockController, mockNode);

      expect(url).toContain('autoconnect=1');
    });
  });

  describe('openVncConsole', () => {
    beforeEach(() => {
      mockNode.status = 'started';
      mockNode.console_type = 'vnc';
    });

    it('should open console for started vnc node', () => {
      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should show error for stopped node', () => {
      mockNode.status = 'stopped';

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Node must be started before opening console'
      );
    });

    it('should show error for non-vnc console type', () => {
      mockNode.console_type = 'telnet';

      service.openVncConsole(mockController, mockNode, false);

      expect(window.open).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Node console type is telnet, not vnc'
      );
    });

    it('should open in new tab when inNewTab is true', () => {
      service.openVncConsole(mockController, mockNode, true);

      expect(window.open).toHaveBeenCalledWith(
        expect.any(String),
        '_blank'
      );
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

    it('should show error when popup is blocked', () => {
      (window.open as any).mockReturnValue(null);

      service.openVncConsole(mockController, mockNode, false);

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Popup was blocked. Please allow popups for this site.'
      );
    });

    it('should handle errors gracefully', () => {
      (window.open as any).mockImplementation(() => {
        throw new Error('Test error');
      });

      service.openVncConsole(mockController, mockNode, false);

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Failed to open VNC console: Test error'
      );
    });
  });
});
