import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { XpraConsoleService } from './xpra-console.service';
import { ToasterService } from './toaster.service';
import { Controller } from '@models/controller';
import { Node } from '../cartography/models/node';
import { Link } from '@models/link';

describe('XpraConsoleService', () => {
  let service: XpraConsoleService;
  let mockToasterService: any;

  const createMockController = (protocol: string = 'http:'): Controller => ({
    id: 1,
    authToken: 'test-token-123',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: protocol as 'http:' | 'https:',
    username: '',
    password: '',
    tokenExpired: false,
  });

  const createMockNode = (): Node =>
    ({
      node_id: 'node-123',
      project_id: 'project-456',
      name: 'Test Node',
      status: 'started',
    }) as Node;

  const createMockLink = (): Link =>
    ({
      link_id: 'link-789',
      project_id: 'project-456',
    }) as Link;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToasterService = {
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        XpraConsoleService,
        { provide: ToasterService, useValue: mockToasterService },
        { provide: APP_BASE_HREF, useValue: '/' },
      ],
    });

    service = TestBed.inject(XpraConsoleService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of XpraConsoleService', () => {
      expect(service).toBeInstanceOf(XpraConsoleService);
    });
  });

  describe('buildXpraWebSocketUrl', () => {
    it('should build WebSocket URL with http protocol', () => {
      const controller = createMockController('http:');
      const node = createMockNode();

      const result = service.buildXpraWebSocketUrl(controller, node);

      expect(result).toBe('ws://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123');
    });

    it('should build WebSocket URL with https protocol', () => {
      const controller = createMockController('https:');
      const node = createMockNode();

      const result = service.buildXpraWebSocketUrl(controller, node);

      expect(result).toBe('wss://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123');
    });

    it('should include correct project and node IDs', () => {
      const controller = createMockController();
      const node = createMockNode();

      const result = service.buildXpraWebSocketUrl(controller, node);

      expect(result).toContain('project-456');
      expect(result).toContain('node-123');
    });

    it('should include auth token', () => {
      const controller = createMockController();
      const node = createMockNode();

      const result = service.buildXpraWebSocketUrl(controller, node);

      expect(result).toContain('token=test-token-123');
    });
  });

  describe('buildXpraWebSocketUrlForWebWireshark', () => {
    it('should build WebSocket URL for web wireshark', () => {
      const controller = createMockController();
      const link = createMockLink();

      const result = service.buildXpraWebSocketUrlForWebWireshark(controller, link);

      expect(result).toBe('ws://localhost:3080/v3/projects/project-456/links/link-789/capture/web-wireshark?token=test-token-123');
    });

    it('should use wss for https controller', () => {
      const controller = createMockController('https:');
      const link = createMockLink();

      const result = service.buildXpraWebSocketUrlForWebWireshark(controller, link);

      expect(result).toBe('wss://localhost:3080/v3/projects/project-456/links/link-789/capture/web-wireshark?token=test-token-123');
    });
  });

  describe('buildXpraConsolePageUrl', () => {
    it('should build xpra console page URL', () => {
      const wsUrl = 'wss://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123';

      const result = service.buildXpraConsolePageUrl(wsUrl);

      expect(result).toContain('/assets/xpra-html5/index.html');
      expect(result).toContain('server=localhost');
      expect(result).toContain('port=3080');
      expect(result).toContain('ssl=true');
    });

    it('should set sound to true', () => {
      const wsUrl = 'wss://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123';

      const result = service.buildXpraConsolePageUrl(wsUrl);

      expect(result).toContain('sound=true');
    });

    it('should set clipboard to true', () => {
      const wsUrl = 'wss://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123';

      const result = service.buildXpraConsolePageUrl(wsUrl);

      expect(result).toContain('clipboard=true');
    });

    it('should set encoding to h264', () => {
      const wsUrl = 'wss://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123';

      const result = service.buildXpraConsolePageUrl(wsUrl);

      expect(result).toContain('encoding=h264');
    });

    it('should include path with token', () => {
      const wsUrl = 'wss://localhost:3080/v3/projects/project-456/nodes/node-123/console/xpra?token=test-token-123';

      const result = service.buildXpraConsolePageUrl(wsUrl);

      expect(result).toContain('path=%2Fv3%2Fprojects%2Fproject-456%2Fnodes%2Fnode-123%2Fconsole%2Fxpra%3Ftoken%3Dtest-token-123');
    });

    it('should show error toast for invalid URL', () => {
      expect(() => service.buildXpraConsolePageUrl('invalid-url')).toThrow();
      expect(mockToasterService.error).toHaveBeenCalled();
    });
  });

  describe('buildXpraConsolePageUrlFromNode', () => {
    it('should build console page URL from controller and node', () => {
      const controller = createMockController();
      const node = createMockNode();

      const result = service.buildXpraConsolePageUrlFromNode(controller, node);

      expect(result).toContain('/assets/xpra-html5/index.html');
      expect(result).toContain('server=localhost');
    });
  });

  describe('openXpraConsole', () => {
    let mockWindow: any;

    beforeEach(() => {
      mockWindow = {
        closed: false,
        close: vi.fn(),
      };
      vi.stubGlobal('window', {
        open: vi.fn().mockReturnValue(mockWindow),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should show error toast if node is not started', () => {
      const controller = createMockController();
      const node = { ...createMockNode(), status: 'stopped' };

      service.openXpraConsole(controller, node);

      expect(mockToasterService.error).toHaveBeenCalledWith('Node must be started before opening console');
    });

    it('should open console in new tab when inNewTab is true', () => {
      const controller = createMockController();
      const node = createMockNode();

      service.openXpraConsole(controller, node, true);

      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('/assets/xpra-html5/index.html'), '_blank');
    });

    it('should show error toast if popup is blocked', () => {
      const controller = createMockController();
      const node = createMockNode();
      vi.stubGlobal('window', {
        open: vi.fn().mockReturnValue(null),
      });

      service.openXpraConsole(controller, node, false);

      expect(mockToasterService.error).toHaveBeenCalledWith('Popup was blocked. Please allow popups for this site.');
    });

    it('should show error toast if popup is closed', () => {
      const controller = createMockController();
      const node = createMockNode();
      mockWindow.closed = true;
      vi.stubGlobal('window', {
        open: vi.fn().mockReturnValue(mockWindow),
      });

      service.openXpraConsole(controller, node, false);

      expect(mockToasterService.error).toHaveBeenCalledWith('Popup was blocked. Please allow popups for this site.');
    });
  });
});
