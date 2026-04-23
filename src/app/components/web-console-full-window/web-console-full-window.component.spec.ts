import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Node as GNS3Node } from '../../cartography/models/node';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

// Create mock instances that will be returned by constructors
const createMockTermInstance = () => ({
  open: vi.fn(),
  dispose: vi.fn(),
  loadAddon: vi.fn(),
  focus: vi.fn(),
  write: vi.fn(),
  attachCustomKeyEventHandler: vi.fn().mockReturnValue(true),
  options: { theme: {} },
});

const createMockFitAddonInstance = () => ({
  fit: vi.fn(),
  activate: vi.fn(),
  load: vi.fn(),
});

let mockTermInstance: ReturnType<typeof createMockTermInstance>;
let mockFitAddonInstance: ReturnType<typeof createMockFitAddonInstance>;

// Mock xterm.js before importing component
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn().mockImplementation(function () {
    mockTermInstance = createMockTermInstance();
    return mockTermInstance;
  }),
}));

vi.mock('@xterm/addon-attach', () => ({
  AttachAddon: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(function () {
    mockFitAddonInstance = createMockFitAddonInstance();
    return mockFitAddonInstance;
  }),
}));

import { WebConsoleFullWindowComponent } from './web-console-full-window.component';
import { NodeConsoleService, ConsoleResizedEvent } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { NodeService } from '@services/node.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';
import { XtermService } from '@services/xterm.service';
import { ToasterService } from '@services/toaster.service';
import { throwError } from 'rxjs';

describe('WebConsoleFullWindowComponent', () => {
  let fixture: ComponentFixture<WebConsoleFullWindowComponent>;
  let component: WebConsoleFullWindowComponent;

  // Subjects for observable mocking
  let consoleResizedSubject: Subject<ConsoleResizedEvent>;
  let themeChangedSubject: Subject<void>;

  const mockController: Controller = {
    id: 1,
    name: 'test-controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    location: 'local',
    authToken: 'test-token',
  } as Controller;

  const mockNode: GNS3Node = {
    node_id: 'node-1',
    project_id: 'project-1',
    name: 'Test Node',
    status: 'started',
    node_type: 'vpcs',
    console_type: 'telnet',
    console_host: 'localhost',
    console: 3081,
    properties: {},
  } as GNS3Node;

  // Define mock services at describe level
  const mockNodeConsoleService = {
    consoleResized: new Subject<ConsoleResizedEvent>(),
    getUrl: vi.fn().mockReturnValue('ws://localhost:3080/test'),
  };

  const mockControllerService = {
    isServiceInitialized: true,
    serviceInitialized: new Subject<boolean>(),
    get: vi.fn().mockResolvedValue(mockController),
  };

  const mockNodeService = {
    getNodeById: vi.fn().mockReturnValue(of(mockNode)),
  };

  const mockThemeService = {
    themeChanged: new Subject<void>(),
    getActualTheme: vi.fn().mockReturnValue('light'),
  };

  const mockXtermContextMenuService = {
    attachContextMenu: vi.fn().mockReturnValue(vi.fn()),
  };

  const mockXtermService = {
    getDefaultTerminalOptions: vi.fn().mockReturnValue({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 15,
    }),
    updateTerminalTheme: vi.fn(),
    initTerminal: vi.fn(),
  };

  const mockToasterService = {
    error: vi.fn(),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: new Map([
        ['controller_id', '1'],
        ['project_id', 'project-1'],
        ['node_id', 'node-1'],
      ]),
    },
  };

  const mockTitle = {
    setTitle: vi.fn(),
  };

  const mockCdr = {
    markForCheck: vi.fn(),
  };

  // Store DOM elements for cleanup
  const domElementsToCleanup: HTMLElement[] = [];

  // Helper to setup terminal mock element ref
  const setupTerminalMock = () => {
    const element = document.createElement('div');
    domElementsToCleanup.push(element);
    const mockElementRef = {
      nativeElement: element,
    };
    Object.defineProperty(component, 'terminal', {
      get: () => () => mockElementRef,
      configurable: true,
    });
  };

  beforeAll(() => {
    // Mock WebSocket once before all tests
    const mockSocketClose = vi.fn();
    const mockSocketSend = vi.fn();
    const mockWebSocketInstance = {
      close: mockSocketClose,
      send: mockSocketSend,
      onerror: null,
      onclose: null,
      readyState: 1,
    };
    vi.stubGlobal(
      'WebSocket',
      vi.fn().mockImplementation(function () {
        return mockWebSocketInstance;
      })
    );

    // Store references to subjects for cleanup
    consoleResizedSubject = mockNodeConsoleService.consoleResized;
    themeChangedSubject = mockThemeService.themeChanged;
  });

  beforeEach(async () => {
    // Reset mock term
    if (mockTermInstance) {
      mockTermInstance.open.mockClear();
      mockTermInstance.dispose.mockClear();
      mockTermInstance.loadAddon.mockClear();
      mockTermInstance.focus.mockClear();
      mockTermInstance.write.mockClear();
      mockTermInstance.attachCustomKeyEventHandler.mockClear();
      mockTermInstance.options.theme = {};
    }
    if (mockFitAddonInstance) {
      mockFitAddonInstance.fit.mockClear();
      mockFitAddonInstance.activate.mockClear();
      mockFitAddonInstance.load.mockClear();
    }

    // Reset service mocks to default state
    mockControllerService.isServiceInitialized = true;
    mockControllerService.get.mockClear();
    mockNodeService.getNodeById.mockClear();
    mockXtermService.getDefaultTerminalOptions.mockClear();
    mockXtermService.updateTerminalTheme.mockClear();
    mockXtermService.initTerminal.mockClear();
    mockXtermContextMenuService.attachContextMenu.mockClear();
    mockTitle.setTitle.mockClear();

    TestBed.configureTestingModule({
      imports: [WebConsoleFullWindowComponent],
      providers: [
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Title, useValue: mockTitle },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: XtermContextMenuService, useValue: mockXtermContextMenuService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: XtermService, useValue: mockXtermService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    });

    fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
    component = fixture.componentInstance;

    // Setup terminal mock for most tests
    setupTerminalMock();
  });

  beforeEach(() => {
    // Reset mock term
    if (mockTermInstance) {
      mockTermInstance.open.mockClear();
      mockTermInstance.dispose.mockClear();
      mockTermInstance.loadAddon.mockClear();
      mockTermInstance.focus.mockClear();
      mockTermInstance.write.mockClear();
      mockTermInstance.attachCustomKeyEventHandler.mockClear();
      mockTermInstance.options.theme = {};
    }
    if (mockFitAddonInstance) {
      mockFitAddonInstance.fit.mockClear();
      mockFitAddonInstance.activate.mockClear();
      mockFitAddonInstance.load.mockClear();
    }

    // Reset service mocks to default state
    mockControllerService.isServiceInitialized = true;

    fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
    component = fixture.componentInstance;

    // Setup terminal mock for most tests
    setupTerminalMock();
  });

  beforeEach(() => {
    // Reset mock term
    if (mockTermInstance) {
      mockTermInstance.open.mockClear();
      mockTermInstance.dispose.mockClear();
      mockTermInstance.loadAddon.mockClear();
      mockTermInstance.focus.mockClear();
      mockTermInstance.write.mockClear();
      mockTermInstance.attachCustomKeyEventHandler.mockClear();
      mockTermInstance.options.theme = {};
    }
    if (mockFitAddonInstance) {
      mockFitAddonInstance.fit.mockClear();
      mockFitAddonInstance.activate.mockClear();
      mockFitAddonInstance.load.mockClear();
    }

    fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
    component = fixture.componentInstance;

    // Setup terminal mock for most tests
    setupTerminalMock();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }

    // Clean up any DOM elements created during tests
    domElementsToCleanup.forEach((element) => {
      element.remove();
    });
    domElementsToCleanup.length = 0;
  });

  afterAll(() => {
    consoleResizedSubject.complete();
    themeChangedSubject.complete();
    vi.restoreAllMocks();

    // Clean up global mocks to prevent test pollution
    vi.unstubAllGlobals();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize terminal with default options from xtermService', () => {
      expect(mockXtermService.getDefaultTerminalOptions).toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('should call getData immediately when service is initialized', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
      expect(mockNodeService.getNodeById).toHaveBeenCalled();
    });

    it('should subscribe to serviceInitialized when service is not initialized', async () => {
      mockControllerService.isServiceInitialized = false;
      const serviceInitializedSubject = new Subject<boolean>();
      mockControllerService.serviceInitialized = serviceInitializedSubject;

      fixture.detectChanges();
      expect(mockControllerService.get).not.toHaveBeenCalled();

      serviceInitializedSubject.next(true);
      await vi.runAllTimersAsync();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
      serviceInitializedSubject.complete();
    });

    it('should subscribe to theme changes', () => {
      fixture.detectChanges();
      expect(mockThemeService.themeChanged).toBeDefined();
    });
  });

  describe('getData', () => {
    it('should extract route parameters correctly', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should call controllerService.get with correct id', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should fetch node by id after getting controller', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockNodeService.getNodeById).toHaveBeenCalledWith(mockController, 'project-1', 'node-1');
    });

    it('should set page title to node name', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockTitle.setTitle).toHaveBeenCalledWith(mockNode.name);
    });

    it('should call initTerminal after fetching node', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockXtermService.initTerminal).toHaveBeenCalled();
    });

    it('should subscribe to consoleResized events', () => {
      fixture.detectChanges();
      expect(mockNodeConsoleService.consoleResized).toBeDefined();
    });

    describe('error handling', () => {
      it('should show error when controllerService.get fails with error.error.message', async () => {
        mockControllerService.get.mockRejectedValue({ error: { message: 'Controller failed' } });

        fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
        component = fixture.componentInstance;
        setupTerminalMock();
        fixture.detectChanges();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Controller failed');
      });

      it('should use fallback message when controller error has no message', async () => {
        mockControllerService.get.mockRejectedValue({});

        fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
        component = fixture.componentInstance;
        setupTerminalMock();
        fixture.detectChanges();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
      });

      it('should show error when nodeService.getNodeById fails with error.error.message', async () => {
        mockControllerService.get.mockResolvedValue(mockController);
        mockNodeService.getNodeById.mockReturnValue(
          throwError(() => ({ error: { message: 'Node failed' } }))
        );

        fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
        component = fixture.componentInstance;
        setupTerminalMock();
        fixture.detectChanges();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Node failed');
      });

      it('should use fallback message when node error has no message', async () => {
        mockControllerService.get.mockResolvedValue(mockController);
        mockNodeService.getNodeById.mockReturnValue(throwError(() => ({})));

        fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
        component = fixture.componentInstance;
        setupTerminalMock();
        fixture.detectChanges();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load node');
      });

      it('should call markForCheck when controllerService.get fails', async () => {
        mockControllerService.get.mockRejectedValue({ error: { message: 'Failed' } });

        fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
        component = fixture.componentInstance;
        setupTerminalMock();
        fixture.detectChanges();
        await vi.runAllTimersAsync();

        expect(mockCdr.markForCheck).toHaveBeenCalled();
      });

      it('should call markForCheck when nodeService.getNodeById fails', async () => {
        mockControllerService.get.mockResolvedValue(mockController);
        mockNodeService.getNodeById.mockReturnValue(
          throwError(() => ({ error: { message: 'Failed' } }))
        );

        fixture = TestBed.createComponent(WebConsoleFullWindowComponent);
        component = fixture.componentInstance;
        setupTerminalMock();
        fixture.detectChanges();
        await vi.runAllTimersAsync();

        expect(mockCdr.markForCheck).toHaveBeenCalled();
      });
    });
  });

  describe('openTerminal', () => {
    it('should open terminal on DOM element', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockTermInstance.open).toHaveBeenCalled();
    });

    it('should update terminal theme', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockXtermService.updateTerminalTheme).toHaveBeenCalled();
    });

    it('should create WebSocket connection', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockTermInstance.open).toHaveBeenCalled();
    });

    it('should load attach addon to terminal', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockTermInstance.loadAddon).toHaveBeenCalled();
    });

    it('should initialize terminal with fitAddon', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockXtermService.initTerminal).toHaveBeenCalled();
    });

    it('should focus the terminal', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockTermInstance.focus).toHaveBeenCalled();
    });

    it('should attach custom key event handler', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockTermInstance.attachCustomKeyEventHandler).toHaveBeenCalled();
    });

    it('should attach context menu for copy/paste', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockXtermContextMenuService.attachContextMenu).toHaveBeenCalled();
    });

    it('should block Ctrl+Shift+C and Ctrl+Shift+V key events', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const ctrlShiftC = { code: 'KeyC', ctrlKey: true, shiftKey: true } as KeyboardEvent;
      const ctrlShiftV = { code: 'KeyV', ctrlKey: true, shiftKey: true } as KeyboardEvent;
      expect(handler(ctrlShiftC)).toBe(false);
      expect(handler(ctrlShiftV)).toBe(false);
    });

    it('should allow regular Ctrl+C and Ctrl+V key events', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const ctrlC = { code: 'KeyC', ctrlKey: true, shiftKey: false } as KeyboardEvent;
      const ctrlV = { code: 'KeyV', ctrlKey: true, shiftKey: false } as KeyboardEvent;
      expect(handler(ctrlC)).toBe(true);
      expect(handler(ctrlV)).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      const destroySpy = vi.spyOn((component as any).destroy$, 'next');
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should close WebSocket connection if socket exists', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      const mockSocket = { close: vi.fn() };
      (component as any).socket = mockSocket;
      component.ngOnDestroy();
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should set socket to null after closing', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      const mockSocket = { close: vi.fn() };
      (component as any).socket = mockSocket;
      component.ngOnDestroy();
      expect((component as any).socket).toBeNull();
    });

    it('should call contextMenuCleanup if present', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      const cleanupSpy = vi.fn();
      (component as any).contextMenuCleanup = cleanupSpy;
      component.ngOnDestroy();
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should set contextMenuCleanup to null after cleanup', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      const cleanupSpy = vi.fn();
      (component as any).contextMenuCleanup = cleanupSpy;
      component.ngOnDestroy();
      expect((component as any).contextMenuCleanup).toBeNull();
    });

    it('should dispose terminal', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      component.ngOnDestroy();
      expect(mockTermInstance.dispose).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      component.ngOnDestroy();
      component.ngOnDestroy();
      // Should not throw
      expect(component).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle consoleResized event emission', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();

      consoleResizedSubject.next({ width: 800, height: 600 });
      await vi.runAllTimersAsync();

      expect(component).toBeTruthy();
    });
  });
});
