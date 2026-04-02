import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebConsoleFullWindowComponent } from './web-console-full-window.component';
import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { NodeService } from '@services/node.service';
import { ThemeService } from '@services/theme.service';
import { XtermService } from '@services/xterm.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';
import { Controller } from '@models/controller';
import { Node as GNS3Node } from '../../cartography/models/node';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    loadAddon: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    focus: vi.fn(),
    options: {},
    onData: vi.fn(() => ({ on: vi.fn() })),
    onResize: vi.fn(() => ({ on: vi.fn() })),
  })),
}));

vi.mock('@xterm/addon-attach', () => ({
  AttachAddon: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    activate: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('WebConsoleFullWindowComponent', () => {
  let component: WebConsoleFullWindowComponent;
  let mockRoute: ActivatedRoute;
  let mockTitle: Title;
  let mockConsoleService: NodeConsoleService;
  let mockControllerService: ControllerService;
  let mockNodeService: NodeService;
  let mockThemeService: ThemeService;
  let mockXtermService: XtermService;
  let mockXtermContextMenuService: XtermContextMenuService;
  let mockCdr: ChangeDetectorRef;
  let mockConsoleResized$: Subject<void>;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    status: 'running',
    authToken: 'test-token',
  } as Controller;

  const mockNode: GNS3Node = {
    node_id: 'node-1',
    project_id: 'project-1',
    name: 'Test Node',
    node_type: 'vpcs',
    console_type: 'telnet',
    status: 'started',
  } as unknown as GNS3Node;

  beforeEach(() => {
    mockConsoleResized$ = new Subject<void>();

    mockRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => {
            const params: Record<string, string> = {
              controller_id: '1',
              project_id: 'project-1',
              node_id: 'node-1',
            };
            return params[key];
          }),
        },
      },
    } as unknown as ActivatedRoute;

    mockTitle = {
      setTitle: vi.fn(),
      getTitle: vi.fn().mockReturnValue('Test Title'),
    } as unknown as Title;

    mockConsoleService = {
      consoleResized: mockConsoleResized$,
      getUrl: vi.fn().mockReturnValue('ws://localhost:3080/test'),
    } as unknown as NodeConsoleService;

    mockControllerService = {
      isServiceInitialized: true,
      serviceInitialized: new Subject<boolean>(),
      get: vi.fn().mockResolvedValue(mockController),
    } as unknown as ControllerService;

    mockNodeService = {
      getNodeById: vi.fn().mockReturnValue(of(mockNode)),
    } as unknown as NodeService;

    mockThemeService = {
      themeChanged: new Subject<void>(),
    } as unknown as ThemeService;

    mockXtermService = {
      getDefaultTerminalOptions: vi.fn().mockReturnValue({
        cursorBlink: true,
        fontSize: 15,
      }),
      updateTerminalTheme: vi.fn(),
      initTerminal: vi.fn(),
    } as unknown as XtermService;

    mockXtermContextMenuService = {
      attachContextMenu: vi.fn().mockReturnValue(vi.fn()),
    } as unknown as XtermContextMenuService;

    mockCdr = {
      markForCheck: vi.fn(),
    } as unknown as ChangeDetectorRef;

    component = new WebConsoleFullWindowComponent();
    (component as any).destroy$ = new Subject<void>();
    (component as any).consoleService = mockConsoleService;
    (component as any).controllerService = mockControllerService;
    (component as any).route = mockRoute;
    (component as any).title = mockTitle;
    (component as any).nodeService = mockNodeService;
    (component as any).themeService = mockThemeService;
    (component as any).contextMenuService = mockXtermContextMenuService;
    (component as any).cdr = mockCdr;
    (component as any).xtermService = mockXtermService;

    vi.spyOn(global, 'WebSocket').mockImplementation(() => ({
      url: 'ws://localhost:3080/test',
      readyState: 1,
      close: vi.fn(),
      send: vi.fn(),
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as WebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    component.ngOnDestroy();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null socket', () => {
      expect((component as any).socket).toBeNull();
    });

    it('should initialize with null contextMenuCleanup', () => {
      expect((component as any).contextMenuCleanup).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should call getData immediately when service is initialized', () => {
      (component as any).controllerService = {
        ...mockControllerService,
        isServiceInitialized: true,
      };
      const getDataSpy = vi.spyOn(component, 'getData');

      component.ngOnInit();

      expect(getDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to serviceInitialized when service is not initialized', () => {
      const serviceInitialized$ = new Subject<boolean>();
      (component as any).controllerService = {
        isServiceInitialized: false,
        serviceInitialized: serviceInitialized$,
        get: vi.fn().mockResolvedValue(mockController),
      };
      const getDataSpy = vi.spyOn(component, 'getData');

      component.ngOnInit();
      expect(getDataSpy).not.toHaveBeenCalled();

      serviceInitialized$.next(true);

      expect(getDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to theme changes', () => {
      const themeSpy = vi.spyOn(mockThemeService.themeChanged, 'subscribe');

      (component as any).themeService = mockThemeService;
      component.ngOnInit();

      expect(themeSpy).toHaveBeenCalled();
    });
  });

  describe('getData', () => {
    it('should extract route parameters correctly', () => {
      (component as any).route = mockRoute;
      component.getData();

      expect((component as any).controllerId).toBe('1');
      expect((component as any).projectId).toBe('project-1');
      expect((component as any).nodeId).toBe('node-1');
    });

    it('should subscribe to consoleResized events', () => {
      const subscribeSpy = vi.spyOn(mockConsoleService.consoleResized, 'subscribe');
      (component as any).consoleService = mockConsoleService;

      component.getData();

      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should call controllerService.get with correct id', () => {
      (component as any).controllerService = mockControllerService;
      component.getData();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should fetch node by id after getting controller', async () => {
      (component as any).nodeService = mockNodeService;
      (component as any).controllerService = mockControllerService;
      component.getData();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNodeService.getNodeById).toHaveBeenCalledWith(
        mockController,
        'project-1',
        'node-1',
      );
    });

    it('should set page title to node name', async () => {
      (component as any).title = mockTitle;
      (component as any).nodeService = mockNodeService;
      (component as any).controllerService = mockControllerService;
      component.getData();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockTitle.setTitle).toHaveBeenCalledWith(mockNode.name);
    });

    it('should call openTerminal after fetching node', async () => {
      const openTerminalSpy = vi.spyOn(component, 'openTerminal');
      (component as any).nodeService = mockNodeService;
      (component as any).controllerService = mockControllerService;
      component.getData();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(openTerminalSpy).toHaveBeenCalled();
    });

    it('should handle error when controllerService.get fails', async () => {
      (component as any).controllerService = {
        get: vi.fn().mockRejectedValue(new Error('Controller not found')),
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.getData();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('openTerminal', () => {
    let mockTerminalRef: ElementRef;

    beforeEach(() => {
      mockTerminalRef = {
        nativeElement: document.createElement('div'),
      } as ElementRef;
      (component as any).terminal = vi.fn(() => mockTerminalRef);
    });

    it('should open terminal on DOM element', () => {
      component.openTerminal();

      expect(component.term.open).toHaveBeenCalledWith(mockTerminalRef.nativeElement);
    });

    it('should update terminal theme', () => {
      component.openTerminal();

      expect(mockXtermService.updateTerminalTheme).toHaveBeenCalledWith(
        component.term,
        mockCdr,
      );
    });

    it('should create WebSocket connection', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3080/test');
    });

    it('should setup socket onerror handler', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;
      const termWriteSpy = vi.spyOn(component.term, 'write');

      component.openTerminal();

      const wsInstance = (global.WebSocket as any).mock.results[0].value;
      wsInstance.onerror?.({} as Event);

      expect(termWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Connection lost'));
    });

    it('should setup socket onclose handler', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;
      const termWriteSpy = vi.spyOn(component.term, 'write');

      component.openTerminal();

      const wsInstance = (global.WebSocket as any).mock.results[0].value;
      wsInstance.onclose?.({} as CloseEvent);

      expect(termWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Connection closed'));
    });

    it('should load attach addon to terminal', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(component.term.loadAddon).toHaveBeenCalled();
    });

    it('should initialize terminal with fitAddon', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(mockXtermService.initTerminal).toHaveBeenCalledWith(component.term, component.fitAddon);
    });

    it('should call fit on fitAddon', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(component.fitAddon.fit).toHaveBeenCalled();
    });

    it('should focus the terminal', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(component.term.focus).toHaveBeenCalled();
    });

    it('should attach custom key event handler', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(component.term.attachCustomKeyEventHandler).toHaveBeenCalled();
    });

    it('should attach context menu for copy/paste', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      expect(mockXtermContextMenuService.attachContextMenu).toHaveBeenCalledWith(
        component.term,
        mockTerminalRef.nativeElement,
      );
    });

    it('should block Ctrl+Shift+C and Ctrl+Shift+V key events', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      const keyHandler = (component.term.attachCustomKeyEventHandler as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const event = { code: 'KeyC', ctrlKey: true, shiftKey: true } as KeyboardEvent;

      const result = keyHandler(event);

      expect(result).toBe(false);
    });

    it('should allow regular Ctrl+C and Ctrl+V key events', () => {
      (component as any).controller = mockController;
      (component as any).node = mockNode;

      component.openTerminal();

      const keyHandler = (component.term.attachCustomKeyEventHandler as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const event = { code: 'KeyC', ctrlKey: true, shiftKey: false } as KeyboardEvent;

      const result = keyHandler(event);

      expect(result).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.ngOnDestroy();

      expect((component as any).destroy$.isStopped).toBe(true);
    });

    it('should close WebSocket connection if open', () => {
      (component as any).socket = {
        close: vi.fn(),
      } as unknown as WebSocket;

      component.ngOnDestroy();

      expect((component as any).socket?.close).toHaveBeenCalled();
    });

    it('should set socket to null after closing', () => {
      (component as any).socket = {
        close: vi.fn(),
      } as unknown as WebSocket;

      component.ngOnDestroy();

      expect((component as any).socket).toBeNull();
    });

    it('should call contextMenuCleanup if present', () => {
      const cleanupFn = vi.fn();
      (component as any).contextMenuCleanup = cleanupFn;

      component.ngOnDestroy();

      expect(cleanupFn).toHaveBeenCalled();
    });

    it('should set contextMenuCleanup to null after cleanup', () => {
      (component as any).contextMenuCleanup = vi.fn();

      component.ngOnDestroy();

      expect((component as any).contextMenuCleanup).toBeNull();
    });

    it('should dispose terminal', () => {
      const termDisposeSpy = vi.spyOn(component.term, 'dispose');

      component.ngOnDestroy();

      expect(termDisposeSpy).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      component.ngOnDestroy();

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing controller gracefully', () => {
      (component as any).controller = undefined;
      (component as any).node = mockNode;

      expect(() => component.openTerminal()).not.toThrow();
    });

    it('should handle missing node gracefully', () => {
      (component as any).controller = mockController;
      (component as any).node = undefined;

      expect(() => component.openTerminal()).not.toThrow();
    });

    it('should handle consoleResized event emission', () => {
      (component as any).consoleService = mockConsoleService;
      component.getData();

      expect(() => mockConsoleResized$.next()).not.toThrow();
    });
  });
});
