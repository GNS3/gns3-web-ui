import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { WebConsoleInlineComponent } from './web-console-inline.component';
import { WindowBoundaryService, WindowStyle } from '../../../services/window-boundary.service';
import { ToasterService } from '../../../services/toaster.service';
import { WindowManagementService } from '../../../services/window-management.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResizeEvent } from 'angular-resizable-element';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the resizable directives
vi.mock('angular-resizable-element', async () => ({
  ResizableDirective: vi.fn().mockReturnValue({}),
  ResizeHandleDirective: vi.fn().mockReturnValue({}),
}));

describe('WebConsoleInlineComponent', () => {
  let component: WebConsoleInlineComponent;
  let fixture: ComponentFixture<WebConsoleInlineComponent>;

  let mockWindowBoundaryService: any;
  let mockToasterService: any;
  let mockWindowManagementService: any;
  let mockSanitizer: any;
  let mockChangeDetector: any;

  let mockController: Controller;
  let mockProject: Project;
  let mockNode: Node;

  // Create a proper SafeResourceUrl object
  const createSafeResourceUrl = (url: string): SafeResourceUrl => {
    const trustedUrl = { changingThisBreaksApplicationSecurity: url } as SafeResourceUrl;
    return trustedUrl;
  };

  const createMocks = () => {
    mockWindowBoundaryService = {
      setConfig: vi.fn(),
      constrainResizeSize: vi.fn().mockReturnValue({
        width: 1024,
        height: 768,
        left: 100,
        top: 100,
      }),
      constrainWindowPosition: vi.fn().mockImplementation((style: WindowStyle) => style),
      getConfigValue: vi.fn().mockReturnValue({ topOffset: 64 }),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockWindowManagementService = {
      minimizedWindows: vi.fn().mockReturnValue([]),
      minimizeWindow: vi.fn(),
      restoreWindow: vi.fn(),
      toggleMinimize: vi.fn(),
    };

    // Create safe URL for the mock
    const safeUrl = createSafeResourceUrl('http://localhost/assets/vnc-console/index.html');
    mockSanitizer = {
      bypassSecurityTrustResourceUrl: vi.fn().mockReturnValue(safeUrl),
    };

    mockChangeDetector = {
      markForCheck: vi.fn(),
      detectChanges: vi.fn(),
    };
  };

  const createMockData = () => {
    mockController = {
      id: 1,
      authToken: 'test-token',
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
    } as Controller;

    mockProject = {
      project_id: 'project-123',
    } as Project;

    mockNode = {
      node_id: 'node-456',
      name: 'Test Node',
      console_type: 'vnc',
      status: 'started',
      properties: {},
      console_host: 'localhost',
      console: 5900,
    } as Node;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    createMocks();
    createMockData();

    await TestBed.configureTestingModule({
      imports: [WebConsoleInlineComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: WindowBoundaryService, useValue: mockWindowBoundaryService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: WindowManagementService, useValue: mockWindowManagementService },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    })
      .overrideProvider(DomSanitizer, { useValue: mockSanitizer })
      .compileComponents();

    fixture = TestBed.createComponent(WebConsoleInlineComponent);
    component = fixture.componentInstance;

    // Inject mocks to replace component's injected instances
    component['cdr'] = mockChangeDetector;
    component['boundaryService'] = mockWindowBoundaryService;
    component['toasterService'] = mockToasterService;
    component['windowManagement'] = mockWindowManagementService;
    component['sanitizer'] = mockSanitizer;

    // Set inputs
    fixture.componentRef.setInput('node', mockNode);
    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('project', mockProject);
    fixture.componentRef.setInput('zIndex', 1000);
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be instance of WebConsoleInlineComponent', () => {
      expect(component).toBeInstanceOf(WebConsoleInlineComponent);
    });
  });

  describe('Inputs', () => {
    it('should receive node input', () => {
      expect(component.node()).toEqual(mockNode);
    });

    it('should receive controller input', () => {
      expect(component.controller()).toEqual(mockController);
    });

    it('should receive project input', () => {
      expect(component.project()).toEqual(mockProject);
    });

    it('should have default zIndex of 1000', () => {
      expect(component.zIndex()).toBe(1000);
    });

    it('should accept custom zIndex', () => {
      fixture.componentRef.setInput('zIndex', 2000);
      expect(component.zIndex()).toBe(2000);
    });
  });

  describe('Signals', () => {
    it('should have isLoading signal default to true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should have isMinimized signal default to false', () => {
      expect(component.isMinimized()).toBe(false);
    });

    it('should have isDragging signal default to false', () => {
      expect(component.isDragging()).toBe(false);
    });

    it('should have isResizing signal default to false', () => {
      expect(component.isResizing()).toBe(false);
    });
  });

  describe('Window Style', () => {
    it('should have default style with fixed position', () => {
      expect(component.style.position).toBe('fixed');
    });

    it('should have default dimensions of 1024x768', () => {
      expect(component.style.width).toBe('1024px');
      expect(component.style.height).toBe('768px');
    });

    it('should track resizedWidth and resizedHeight', () => {
      expect(component.resizedWidth).toBe(1024);
      expect(component.resizedHeight).toBe(768);
    });
  });

  describe('consoleUrl', () => {
    it('should build VNC console URL', () => {
      // Manually call ngOnInit since we skipped detectChanges
      component.ngOnInit();

      expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled();
      expect(component.consoleUrl).toBeTruthy();
    });

    it('should build HTTP console URL for http console type', () => {
      const httpNode = { ...mockNode, console_type: 'http' } as Node;
      fixture.componentRef.setInput('node', httpNode);

      component.ngOnInit();

      expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled();
      expect(component.consoleUrl).toBeTruthy();
    });

    it('should build HTTPS console URL for https console type', () => {
      const httpsNode = { ...mockNode, console_type: 'https' } as Node;
      fixture.componentRef.setInput('node', httpsNode);

      component.ngOnInit();

      expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled();
      expect(component.consoleUrl).toBeTruthy();
    });

    it('should show error for unsupported console type', () => {
      const telnetNode = { ...mockNode, console_type: 'telnet' } as Node;
      fixture.componentRef.setInput('node', telnetNode);

      component.ngOnInit();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        expect.stringContaining('not supported in inline mode')
      );
    });
  });

  describe('adjustWindowSizeFromConsoleResolution()', () => {
    it('should use default size when no console_resolution', () => {
      component.ngOnInit();

      expect(component.resizedWidth).toBe(1024);
      expect(component.resizedHeight).toBe(768);
    });

    it('should adjust window size based on console_resolution', () => {
      const nodeWithResolution = {
        ...mockNode,
        properties: { console_resolution: '1280x720' },
      } as Node;
      fixture.componentRef.setInput('node', nodeWithResolution);

      component.ngOnInit();

      expect(component.resizedWidth).toBe(1290); // 1280 + 10
      expect(component.resizedHeight).toBe(730); // 720 + 10
    });

    it('should handle invalid resolution format', () => {
      const nodeWithInvalidResolution = {
        ...mockNode,
        properties: { console_resolution: 'invalid' },
      } as Node;
      fixture.componentRef.setInput('node', nodeWithInvalidResolution);

      component.ngOnInit();

      // Should use default size when resolution is invalid
      expect(component.resizedWidth).toBe(1024);
      expect(component.resizedHeight).toBe(768);
    });
  });

  describe('getWindowId()', () => {
    it('should generate correct window ID for node', () => {
      expect(component['getWindowId']()).toBe('console-node-456');
    });

    it('should generate different IDs for different nodes', () => {
      const anotherNode = { ...mockNode, node_id: 'node-789' } as Node;
      fixture.componentRef.setInput('node', anotherNode);

      expect(component['getWindowId']()).toBe('console-node-789');
    });
  });

  describe('close()', () => {
    it('should emit closeWindow', () => {
      const emitSpy = vi.spyOn(component.closeWindow, 'emit');
      component.close();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should restore window in window management service', () => {
      component.close();
      expect(mockWindowManagementService.restoreWindow).toHaveBeenCalledWith('console-node-456');
    });
  });

  describe('toggleMinimize()', () => {
    it('should call window management toggleMinimize', () => {
      component.toggleMinimize();
      expect(mockWindowManagementService.toggleMinimize).toHaveBeenCalledWith(
        'console-node-456',
        'console',
        'node-456'
      );
    });

    it('should call markForCheck after toggle', () => {
      component.toggleMinimize();
      expect(mockChangeDetector.markForCheck).toHaveBeenCalled();
    });
  });

  describe('onWindowFocus()', () => {
    it('should emit windowFocused', () => {
      const emitSpy = vi.spyOn(component.windowFocused, 'emit');
      component.onWindowFocus();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should restore window if minimized', () => {
      // Set minimized state
      component['isMinimizedSignal'].set(true);

      component.onWindowFocus();

      expect(mockWindowManagementService.toggleMinimize).toHaveBeenCalled();
    });
  });

  describe('validate()', () => {
    it('should return true for valid resize', () => {
      const event = {
        rectangle: { width: 500, height: 400 },
      } as ResizeEvent;
      expect(component.validate(event)).toBe(true);
    });

    it('should return false for width below minimum', () => {
      const event = {
        rectangle: { width: 300, height: 400 },
      } as ResizeEvent;
      expect(component.validate(event)).toBe(false);
    });

    it('should return false for height below minimum', () => {
      const event = {
        rectangle: { width: 500, height: 200 },
      } as ResizeEvent;
      expect(component.validate(event)).toBe(false);
    });
  });

  describe('onResizeStart()', () => {
    it('should set isResizing to true', () => {
      component.onResizeStart();
      expect(component.isResizing()).toBe(true);
    });

    it('should call markForCheck', () => {
      component.onResizeStart();
      expect(mockChangeDetector.markForCheck).toHaveBeenCalled();
    });
  });

  describe('onResizeEnd()', () => {
    it('should set isResizing to false', () => {
      component.onResizeEnd({ rectangle: { width: 600, height: 500 } } as ResizeEvent);
      expect(component.isResizing()).toBe(false);
    });

    it('should constrain resize dimensions', () => {
      component.onResizeEnd({ rectangle: { width: 700, height: 500, left: 50, top: 50 } } as ResizeEvent);
      expect(mockWindowBoundaryService.constrainResizeSize).toHaveBeenCalled();
    });
  });

  describe('onIframeLoad()', () => {
    it('should set isLoading to false', () => {
      component.onIframeLoad();
      expect(component.isLoading()).toBe(false);
    });

    it('should call markForCheck', () => {
      component.onIframeLoad();
      expect(mockChangeDetector.markForCheck).toHaveBeenCalled();
    });
  });
});
