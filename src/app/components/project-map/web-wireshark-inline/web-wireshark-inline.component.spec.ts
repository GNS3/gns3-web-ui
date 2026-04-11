import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { WebWiresharkInlineComponent } from './web-wireshark-inline.component';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { XpraConsoleService } from '@services/xpra-console.service';
import { ToasterService } from '@services/toaster.service';
import { WindowManagementService } from '@services/window-management.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResizeEvent } from 'angular-resizable-element';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the resizable directives
vi.mock('angular-resizable-element', async () => ({
  ResizableDirective: vi.fn().mockReturnValue({}),
  ResizeHandleDirective: vi.fn().mockReturnValue({}),
}));

describe('WebWiresharkInlineComponent', () => {
  let component: WebWiresharkInlineComponent;
  let fixture: ComponentFixture<WebWiresharkInlineComponent>;

  let mockWindowBoundaryService: any;
  let mockXpraConsoleService: any;
  let mockToasterService: any;
  let mockWindowManagementService: any;
  let mockSanitizer: any;
  let mockChangeDetector: any;

  let mockController: Controller;
  let mockProject: Project;
  let mockLink: Link;

  // Create a proper SafeResourceUrl object
  const createSafeResourceUrl = (url: string): SafeResourceUrl => {
    const trustedUrl = { changingThisBreaksApplicationSecurity: url } as SafeResourceUrl;
    return trustedUrl;
  };

  const createMocks = () => {
    mockWindowBoundaryService = {
      setConfig: vi.fn(),
      constrainResizeSize: vi.fn().mockReturnValue({
        width: 800,
        height: 600,
        left: 100,
        top: 100,
      }),
      constrainWindowPosition: vi.fn().mockImplementation((style: WindowStyle) => style),
      getConfigValue: vi.fn().mockReturnValue({ topOffset: 64 }),
    };

    mockXpraConsoleService = {
      buildXpraWebSocketUrlForWebWireshark: vi.fn().mockReturnValue('wss://localhost:3080/wireshark'),
      buildXpraConsolePageUrl: vi.fn().mockReturnValue('http://localhost/assets/xpra-html5/index.html'),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockWindowManagementService = {
      minimizedWindows: vi.fn().mockReturnValue([]),
      minimizeWindow: vi.fn(),
      restoreWindow: vi.fn(),
      toggleMinimize: vi.fn(),
    };

    // Create safe URL for the mock
    const safeUrl = createSafeResourceUrl('http://localhost/assets/xpra-html5/index.html');
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

    mockLink = {
      link_id: 'link-456',
      capture_file_name: 'test_capture.pcap',
    } as Link;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    createMocks();
    createMockData();

    await TestBed.configureTestingModule({
      imports: [WebWiresharkInlineComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: WindowBoundaryService, useValue: mockWindowBoundaryService },
        { provide: XpraConsoleService, useValue: mockXpraConsoleService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: WindowManagementService, useValue: mockWindowManagementService },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    })
      .overrideProvider(DomSanitizer, { useValue: mockSanitizer })
      .compileComponents();

    fixture = TestBed.createComponent(WebWiresharkInlineComponent);
    component = fixture.componentInstance;

    // Inject mocks to replace component's injected instances
    component['cdr'] = mockChangeDetector;
    component['xpraConsoleService'] = mockXpraConsoleService;
    component['boundaryService'] = mockWindowBoundaryService;
    component['toasterService'] = mockToasterService;
    component['windowManagement'] = mockWindowManagementService;
    component['sanitizer'] = mockSanitizer;

    // Set inputs
    fixture.componentRef.setInput('link', mockLink);
    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('project', mockProject);
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

    it('should be instance of WebWiresharkInlineComponent', () => {
      expect(component).toBeInstanceOf(WebWiresharkInlineComponent);
    });
  });

  describe('Inputs', () => {
    it('should receive link input', () => {
      expect(component.link()).toEqual(mockLink);
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

    it('should have default dimensions', () => {
      expect(component.style.width).toBe('800px');
      expect(component.style.height).toBe('600px');
    });

    it('should track resizedWidth and resizedHeight', () => {
      expect(component.resizedWidth).toBe(800);
      expect(component.resizedHeight).toBe(600);
    });
  });

  describe('wiresharkUrl', () => {
    it('should build wireshark URL', () => {
      // Manually call ngOnInit since we skipped detectChanges
      component.ngOnInit();

      expect(mockXpraConsoleService.buildXpraWebSocketUrlForWebWireshark).toHaveBeenCalledWith(mockController, mockLink);
      expect(mockXpraConsoleService.buildXpraConsolePageUrl).toHaveBeenCalled();
    });

    it('should use DomSanitizer to bypass security', () => {
      component.ngOnInit();

      expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled();
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
      expect(mockWindowManagementService.restoreWindow).toHaveBeenCalledWith('wireshark-link-456');
    });
  });

  describe('toggleMinimize()', () => {
    it('should call window management toggleMinimize', () => {
      component.toggleMinimize();
      expect(mockWindowManagementService.toggleMinimize).toHaveBeenCalledWith(
        'wireshark-link-456',
        'wireshark',
        'link-456'
      );
    });
  });

  describe('onWindowFocus()', () => {
    it('should emit windowFocused', () => {
      const emitSpy = vi.spyOn(component.windowFocused, 'emit');
      component.onWindowFocus();
      expect(emitSpy).toHaveBeenCalled();
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
  });
});
