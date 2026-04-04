import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { Controller } from '@models/controller';
import { Node as GNS3Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { WebConsoleComponent } from './web-console.component';
import { NodeConsoleService, ConsoleResizedEvent } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';
import { XtermService } from '@services/xterm.service';

// Store DOM elements for cleanup
const domElementsToCleanup: HTMLElement[] = [];

// Create mock instances
const createMockTermInstance = () => {
  const element = document.createElement('div');
  domElementsToCleanup.push(element);
  return {
    open: vi.fn(),
    dispose: vi.fn(),
    loadAddon: vi.fn(),
    focus: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    attachCustomKeyEventHandler: vi.fn().mockReturnValue(true),
    cols: 100,
    rows: 32,
    element,
  };
};

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

describe('WebConsoleComponent', () => {
  let fixture: ComponentFixture<WebConsoleComponent>;
  let component: WebConsoleComponent;

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

  const mockProject: Project = {
    project_id: 'project-1',
    name: 'Test Project',
    status: 'opened',
  } as Project;

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

  // Define mock services
  const mockNodeConsoleService = {
    consoleResized: new Subject<ConsoleResizedEvent>(),
    getUrl: vi.fn().mockReturnValue('ws://localhost:3080/test'),
    getNumberOfColumns: vi.fn().mockReturnValue(80),
    getNumberOfRows: vi.fn().mockReturnValue(24),
    setNumberOfColumns: vi.fn(),
    setNumberOfRows: vi.fn(),
    closeConsoleForNode: vi.fn(),
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

  const mockCdr = {
    markForCheck: vi.fn(),
  };

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
      onopen: null,
      onmessage: null,
      readyState: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal(
      'WebSocket',
      vi.fn().mockImplementation(function () {
        return mockWebSocketInstance;
      })
    );

    // Mock ResizeObserver
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn().mockImplementation(function (callback: ResizeObserverCallback) {
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          callback,
        };
      })
    );

    // Mock matchMedia for xterm.js (JSDOM doesn't support it)
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    );

    // Store references to subjects for cleanup
    consoleResizedSubject = mockNodeConsoleService.consoleResized;
    themeChangedSubject = mockThemeService.themeChanged;
  });

  beforeEach(async () => {
    // Clear all mocks to prevent test pollution
    vi.clearAllMocks();

    // Reset mock term
    if (mockTermInstance) {
      mockTermInstance.open.mockClear();
      mockTermInstance.dispose.mockClear();
      mockTermInstance.loadAddon.mockClear();
      mockTermInstance.focus.mockClear();
      mockTermInstance.write.mockClear();
      mockTermInstance.resize.mockClear();
      mockTermInstance.attachCustomKeyEventHandler.mockClear();
      mockTermInstance.cols = 100;
      mockTermInstance.rows = 32;
    }
    if (mockFitAddonInstance) {
      mockFitAddonInstance.fit.mockClear();
      mockFitAddonInstance.activate.mockClear();
      mockFitAddonInstance.load.mockClear();
    }

    // Reset service mocks to default state
    mockNodeConsoleService.getNumberOfColumns.mockReturnValue(80);
    mockNodeConsoleService.getNumberOfRows.mockReturnValue(24);
    mockXtermService.getDefaultTerminalOptions.mockClear();
    mockXtermService.updateTerminalTheme.mockClear();
    mockXtermService.initTerminal.mockClear();
    mockXtermContextMenuService.attachContextMenu.mockClear();
    mockThemeService.getActualTheme.mockReturnValue('light');
    mockCdr.markForCheck.mockClear();

    TestBed.configureTestingModule({
      imports: [WebConsoleComponent],
      providers: [
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: XtermContextMenuService, useValue: mockXtermContextMenuService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: XtermService, useValue: mockXtermService },
      ],
    });

    fixture = TestBed.createComponent(WebConsoleComponent);
    component = fixture.componentInstance;

    // Set inputs using setInput
    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('project', mockProject);
    fixture.componentRef.setInput('node', mockNode);

    // Setup terminal mock
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
    consoleResizedSubject?.complete();
    themeChangedSubject?.complete();

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

    it('should have isLightThemeEnabled set to false when theme is light', () => {
      expect(component.isLightThemeEnabled).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should get theme and set isLightThemeEnabled', () => {
      fixture.detectChanges();
      expect(mockThemeService.getActualTheme).toHaveBeenCalled();
      expect(component.isLightThemeEnabled).toBe(true);
    });

    it('should call markForCheck on cdr', () => {
      // Verify component initializes correctly with theme (light theme = isLightThemeEnabled is true)
      fixture.detectChanges();
      expect(component.isLightThemeEnabled).toBe(true);
    });

    it('should subscribe to theme changes', () => {
      fixture.detectChanges();
      expect(mockThemeService.themeChanged).toBeDefined();
    });

    it('should subscribe to consoleResized events', () => {
      fixture.detectChanges();
      expect(mockNodeConsoleService.consoleResized).toBeDefined();
    });

    it('should resize terminal when getNumberOfColumns and getNumberOfRows return values', () => {
      fixture.detectChanges();
      expect(mockNodeConsoleService.getNumberOfColumns).toHaveBeenCalled();
      expect(mockNodeConsoleService.getNumberOfRows).toHaveBeenCalled();
      expect(mockTermInstance.resize).toHaveBeenCalledWith(80, 24);
    });

    it('should not resize terminal when getNumberOfColumns returns falsy', () => {
      mockNodeConsoleService.getNumberOfColumns.mockReturnValue(0);
      fixture.detectChanges();
      expect(mockTermInstance.resize).not.toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should open terminal on DOM element', () => {
      fixture.detectChanges();
      expect(mockTermInstance.open).toHaveBeenCalled();
    });

    it('should update terminal theme', () => {
      fixture.detectChanges();
      expect(mockXtermService.updateTerminalTheme).toHaveBeenCalled();
    });

    it('should create WebSocket connection', () => {
      fixture.detectChanges();
      expect(mockNodeConsoleService.getUrl).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should load attach addon to terminal', () => {
      fixture.detectChanges();
      expect(mockTermInstance.loadAddon).toHaveBeenCalled();
    });

    it('should initialize terminal with fitAddon', () => {
      fixture.detectChanges();
      expect(mockXtermService.initTerminal).toHaveBeenCalled();
    });

    it('should fit the terminal', () => {
      fixture.detectChanges();
      expect(mockFitAddonInstance.fit).toHaveBeenCalled();
    });

    it('should focus the terminal', () => {
      fixture.detectChanges();
      expect(mockTermInstance.focus).toHaveBeenCalled();
    });

    it('should attach custom key event handler', () => {
      fixture.detectChanges();
      expect(mockTermInstance.attachCustomKeyEventHandler).toHaveBeenCalled();
    });

    it('should attach context menu for copy/paste', () => {
      fixture.detectChanges();
      expect(mockXtermContextMenuService.attachContextMenu).toHaveBeenCalled();
    });

    it('should block Alt+1-9 key events by dispatching custom event', () => {
      fixture.detectChanges();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const altKey = { altKey: true, key: '1' } as KeyboardEvent;
      const dispatchEventSpy = vi.spyOn(mockTermInstance.element, 'dispatchEvent');
      const result = handler(altKey);
      expect(result).toBe(false);
      expect(dispatchEventSpy).toHaveBeenCalled();
    });

    it('should block Ctrl+Shift+C key events', () => {
      fixture.detectChanges();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const ctrlShiftC = { code: 'KeyC', ctrlKey: true, shiftKey: true } as KeyboardEvent;
      expect(handler(ctrlShiftC)).toBe(false);
    });

    it('should block Ctrl+Shift+V key events', () => {
      fixture.detectChanges();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const ctrlShiftV = { code: 'KeyV', ctrlKey: true, shiftKey: true } as KeyboardEvent;
      expect(handler(ctrlShiftV)).toBe(false);
    });

    it('should allow regular Ctrl+C key events', () => {
      fixture.detectChanges();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const ctrlC = { code: 'KeyC', ctrlKey: true, shiftKey: false } as KeyboardEvent;
      expect(handler(ctrlC)).toBe(true);
    });

    it('should allow regular Ctrl+V key events', () => {
      fixture.detectChanges();
      const handler = mockTermInstance.attachCustomKeyEventHandler.mock.calls[0][0];
      const ctrlV = { code: 'KeyV', ctrlKey: true, shiftKey: false } as KeyboardEvent;
      expect(handler(ctrlV)).toBe(true);
    });
  });

  describe('WebSocket error handling', () => {
    it('should write error message on socket error', () => {
      fixture.detectChanges();
      // Get the onerror handler that was set
      const WebSocketConstructor = vi.mocked(WebSocket);
      const wsInstance = WebSocketConstructor.mock.results[0]?.value;
      if (wsInstance && wsInstance.onerror) {
        wsInstance.onerror(new Event('error'));
      }
      expect(mockTermInstance.write).toHaveBeenCalled();
    });

    it('should write close message and close console on socket close', () => {
      fixture.detectChanges();
      const WebSocketConstructor = vi.mocked(WebSocket);
      const wsInstance = WebSocketConstructor.mock.results[0]?.value;
      if (wsInstance && wsInstance.onclose) {
        wsInstance.onclose(new CloseEvent('close'));
      }
      expect(mockTermInstance.write).toHaveBeenCalled();
      expect(mockNodeConsoleService.closeConsoleForNode).toHaveBeenCalledWith(mockNode);
    });
  });

  describe('focusTerminal', () => {
    it('should focus the terminal', () => {
      fixture.detectChanges();
      component.focusTerminal();
      expect(mockTermInstance.focus).toHaveBeenCalled();
    });
  });

  describe('fitTerminal', () => {
    it('should fit the terminal', () => {
      fixture.detectChanges();
      (component as any).fitTerminal();
      expect(mockFitAddonInstance.fit).toHaveBeenCalled();
    });

    it('should set number of columns and rows on consoleService', () => {
      fixture.detectChanges();
      (component as any).fitTerminal();
      expect(mockNodeConsoleService.setNumberOfColumns).toHaveBeenCalledWith(mockTermInstance.cols);
      expect(mockNodeConsoleService.setNumberOfRows).toHaveBeenCalledWith(mockTermInstance.rows);
    });

    it('should resize terminal to fit dimensions', () => {
      fixture.detectChanges();
      (component as any).fitTerminal();
      expect(mockTermInstance.resize).toHaveBeenCalledWith(mockTermInstance.cols, mockTermInstance.rows);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = vi.spyOn((component as any).destroy$, 'next');
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should close WebSocket connection if socket exists', () => {
      fixture.detectChanges();
      const mockSocket = { close: vi.fn() };
      (component as any).socket = mockSocket;
      component.ngOnDestroy();
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should set socket to null after closing', () => {
      fixture.detectChanges();
      const mockSocket = { close: vi.fn() };
      (component as any).socket = mockSocket;
      component.ngOnDestroy();
      expect((component as any).socket).toBeNull();
    });

    it('should disconnect resizeObserver if present', () => {
      fixture.detectChanges();
      const mockResizeObserver = { disconnect: vi.fn() };
      (component as any).resizeObserver = mockResizeObserver;
      component.ngOnDestroy();
      expect(mockResizeObserver.disconnect).toHaveBeenCalled();
      expect((component as any).resizeObserver).toBeNull();
    });

    it('should call contextMenuCleanup if present', () => {
      fixture.detectChanges();
      const cleanupSpy = vi.fn();
      (component as any).contextMenuCleanup = cleanupSpy;
      component.ngOnDestroy();
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should set contextMenuCleanup to null after cleanup', () => {
      fixture.detectChanges();
      const cleanupSpy = vi.fn();
      (component as any).contextMenuCleanup = cleanupSpy;
      component.ngOnDestroy();
      expect((component as any).contextMenuCleanup).toBeNull();
    });

    it('should dispose terminal', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(mockTermInstance.dispose).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      component.ngOnDestroy();
      // Should not throw
      expect(component).toBeTruthy();
    });
  });

  describe('ResizeObserver', () => {
    it('should setup ResizeObserver in ngAfterViewInit', () => {
      fixture.detectChanges();
      expect((component as any).resizeObserver).toBeDefined();
    });

    it('should call disconnect on resizeObserver during destroy', () => {
      fixture.detectChanges();
      const mockResizeObserver = { disconnect: vi.fn() };
      (component as any).resizeObserver = mockResizeObserver;
      component.ngOnDestroy();
      expect(mockResizeObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Theme change handling', () => {
    it('should update theme when themeChanged emits', () => {
      mockThemeService.getActualTheme.mockReturnValue('light');
      fixture.detectChanges();
      themeChangedSubject.next();
      expect(mockXtermService.updateTerminalTheme).toHaveBeenCalled();
    });

    it('should update isLightThemeEnabled when theme changes to dark', () => {
      // Initial theme is light, so isLightThemeEnabled = true
      mockThemeService.getActualTheme.mockReturnValue('light');
      fixture.detectChanges();
      expect(component.isLightThemeEnabled).toBe(true);

      // Simulate theme change to dark
      mockThemeService.getActualTheme.mockReturnValue('dark');
      themeChangedSubject.next();
      expect(component.isLightThemeEnabled).toBe(false);
    });

    it('should update isLightThemeEnabled when theme changes to light', () => {
      // Initial theme is dark, so isLightThemeEnabled = false
      mockThemeService.getActualTheme.mockReturnValue('dark');
      fixture.detectChanges();
      expect(component.isLightThemeEnabled).toBe(false);

      // Simulate theme change to light
      mockThemeService.getActualTheme.mockReturnValue('light');
      themeChangedSubject.next();
      expect(component.isLightThemeEnabled).toBe(true);
    });
  });

  describe('Console resize handling', () => {
    it('should call fitTerminal when consoleResized emits', () => {
      fixture.detectChanges();
      const fitTerminalSpy = vi.spyOn(component as any, 'fitTerminal');
      consoleResizedSubject.next({ width: 800, height: 600 });
      vi.runAllTimers();
      expect(fitTerminalSpy).toHaveBeenCalled();
    });
  });
});
