import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NodeConsoleService } from './nodeConsole.service';
import { Router } from '@angular/router';
import { ToasterService } from './toaster.service';
import { MapSettingsService } from './mapsettings.service';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
  },
}));

vi.useFakeTimers();

describe('NodeConsoleService', () => {
  let service: NodeConsoleService;
  let mockRouter: any;
  let mockToasterService: any;
  let mockMapSettingsService: any;
  let mockNode: Node;
  let mockController: Controller;
  let originalWindow: typeof window;

  beforeEach(() => {
    originalWindow = global.window;

    mockRouter = {
      url: '/projects/project-1',
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockMapSettingsService = {
      logConsoleSubject: {
        next: vi.fn(),
      },
    };

    mockNode = {
      node_id: 'node-1',
      name: 'Test Node',
      project_id: 'project-1',
      console_type: 'telnet',
      status: 'started',
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

    service = new NodeConsoleService(mockRouter, mockToasterService, mockMapSettingsService);
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('Service Creation', () => {
    it('should initialize with default console dimensions', () => {
      expect(service.defaultConsoleWidth).toBe(720);
      expect(service.defaultConsoleHeight).toBe(408);
    });

    it('should initialize with default number of columns and rows', () => {
      expect(service.defaultNumberOfColumns).toBe(80);
      expect(service.defaultNumberOfRows).toBe(24);
    });
  });

  describe('getNumberOfColumns', () => {
    it('should return undefined initially', () => {
      expect(service.getNumberOfColumns()).toBeUndefined();
    });

    it('should return set value', () => {
      service.setNumberOfColumns(100);
      expect(service.getNumberOfColumns()).toBe(100);
    });
  });

  describe('getNumberOfRows', () => {
    it('should return undefined initially', () => {
      expect(service.getNumberOfRows()).toBeUndefined();
    });

    it('should return set value', () => {
      service.setNumberOfRows(30);
      expect(service.getNumberOfRows()).toBe(30);
    });
  });

  describe('openConsoleForNode', () => {
    it('should emit node on nodeConsoleTrigger', () => {
      const emittedNode: (Node | undefined)[] = [];
      const subscription = service.nodeConsoleTrigger.subscribe((node) => {
        emittedNode.push(node);
      });

      service.openConsoleForNode(mockNode);

      expect(emittedNode[0]).toBe(mockNode);
      subscription.unsubscribe();
    });
  });

  describe('closeConsoleForNode', () => {
    it('should emit node on closeNodeConsoleTrigger', () => {
      const emittedNode: (Node | undefined)[] = [];
      const subscription = service.closeNodeConsoleTrigger.subscribe((node) => {
        emittedNode.push(node);
      });

      service.closeConsoleForNode(mockNode);

      expect(emittedNode[0]).toBe(mockNode);
      subscription.unsubscribe();
    });
  });

  describe('resizeTerminal', () => {
    it('should emit event on consoleResized', () => {
      const event = { width: 800, height: 600 };
      const emittedEvent: any[] = [];
      const subscription = service.consoleResized.subscribe((e) => {
        emittedEvent.push(e);
      });

      service.resizeTerminal(event);

      expect(emittedEvent[0]).toEqual(event);
      subscription.unsubscribe();
    });
  });

  describe('getLineWidth', () => {
    it('should calculate line width correctly', () => {
      const expectedWidth = 720 / 80;
      expect(service.getLineWidth()).toBe(expectedWidth);
    });
  });

  describe('getLineHeight', () => {
    it('should calculate line height correctly', () => {
      const expectedHeight = 408 / 24;
      expect(service.getLineHeight()).toBe(expectedHeight);
    });
  });

  describe('getUrl', () => {
    it('should return ws URL for http protocol', () => {
      const url = service.getUrl(mockController, mockNode);

      expect(url).toMatch(/^ws:\/\/localhost:3080\/3\.0\.0\/projects\/project-1\/nodes\/node-1\/console\/ws\?token=test-token$/);
    });

    it('should return wss URL for https protocol', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      const url = service.getUrl(httpsController, mockNode);

      expect(url).toMatch(/^wss:\/\/localhost:3080\/3\.0\.0\/projects\/project-1\/nodes\/node-1\/console\/ws\?token=test-token$/);
    });

    it('should return ws URL for unknown protocol', () => {
      const unknownController = { ...mockController, protocol: 'ftp:' as any };
      const url = service.getUrl(unknownController, mockNode);

      expect(url).toMatch(/^ws:\/\/localhost:3080\/3\.0\.0\/projects\/project-1\/nodes\/node-1\/console\/ws\?token=test-token$/);
    });
  });

  describe('openConsolesForAllNodesInWidget', () => {
    it('should open console for started node', () => {
      const openedNode: (Node | undefined)[] = [];
      const subscription = service.nodeConsoleTrigger.subscribe((node) => {
        openedNode.push(node);
      });

      service.openConsolesForAllNodesInWidget([mockNode]);

      vi.advanceTimersByTime(500);

      expect(mockMapSettingsService.logConsoleSubject.next).toHaveBeenCalledWith(true);
      expect(openedNode[0]).toBeDefined();
      subscription.unsubscribe();
    });

    it('should show error for stopped node', () => {
      const stoppedNode = { ...mockNode, status: 'stopped' };

      service.openConsolesForAllNodesInWidget([stoppedNode]);

      expect(mockToasterService.error).toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith(
        expect.stringContaining('Please start the following nodes')
      );
    });

    it('should skip nodes with none console type', () => {
      const noneNode = { ...mockNode, console_type: 'none' };

      service.openConsolesForAllNodesInWidget([noneNode]);

      expect(mockMapSettingsService.logConsoleSubject.next).not.toHaveBeenCalled();
    });
  });

  describe('openConsolesForAllNodesInNewTabs', () => {
    it('should open tab for started telnet node', () => {
      mockRouter.url = '/projects/project-1/edit';
      global.window = {
        open: vi.fn(),
      } as any;

      service.openConsolesForAllNodesInNewTabs([mockNode]);

      expect(window.open).toHaveBeenCalled();
    });

    it('should show error for stopped node', () => {
      const stoppedNode = { ...mockNode, status: 'stopped' };

      service.openConsolesForAllNodesInNewTabs([stoppedNode]);

      expect(mockToasterService.error).toHaveBeenCalled();
    });

    it('should skip non-telnet console types', () => {
      global.window = {
        open: vi.fn(),
      } as any;
      const vncNode = { ...mockNode, console_type: 'vnc' };

      service.openConsolesForAllNodesInNewTabs([vncNode]);

      expect(window.open).not.toHaveBeenCalled();
    });
  });
});
