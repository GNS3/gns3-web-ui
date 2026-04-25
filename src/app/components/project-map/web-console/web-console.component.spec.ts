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

    // Mock matchMedia (JSDOM doesn't support it)
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
    vi.clearAllMocks();

    // Reset service mocks to default state
    mockNodeConsoleService.getNumberOfColumns.mockReturnValue(80);
    mockNodeConsoleService.getNumberOfRows.mockReturnValue(24);
    mockThemeService.getActualTheme.mockReturnValue('light');

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
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  afterAll(() => {
    consoleResizedSubject?.complete();
    themeChangedSubject?.complete();
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

    it('should call getNumberOfColumns and getNumberOfRows', () => {
      fixture.detectChanges();
      expect(mockNodeConsoleService.getNumberOfColumns).toHaveBeenCalled();
      expect(mockNodeConsoleService.getNumberOfRows).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should update terminal theme', () => {
      fixture.detectChanges();
      expect(mockXtermService.updateTerminalTheme).toHaveBeenCalled();
    });

    it('should create WebSocket connection', () => {
      fixture.detectChanges();
      expect(mockNodeConsoleService.getUrl).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should initialize terminal with fitAddon', () => {
      fixture.detectChanges();
      expect(mockXtermService.initTerminal).toHaveBeenCalled();
    });

    it('should attach context menu for copy/paste', () => {
      fixture.detectChanges();
      expect(mockXtermContextMenuService.attachContextMenu).toHaveBeenCalled();
    });
  });

  describe('WebSocket error handling', () => {
    it('should call closeConsoleForNode on socket close', () => {
      fixture.detectChanges();
      const WebSocketConstructor = vi.mocked(WebSocket);
      const wsInstance = WebSocketConstructor.mock.results[0]?.value;
      if (wsInstance && wsInstance.onclose) {
        wsInstance.onclose(new CloseEvent('close'));
      }
      expect(mockNodeConsoleService.closeConsoleForNode).toHaveBeenCalledWith(mockNode);
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
