import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectLinkComponent } from './direct-link.component';
import { ControllerService } from '@services/controller.service';
import { ControllerDatabase } from '@services/controller.database';
import { ToasterService } from '@services/toaster.service';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DirectLinkComponent', () => {
  let fixture: ComponentFixture<DirectLinkComponent>;
  let component: DirectLinkComponent;

  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockControllerService: any;
  let mockControllerDatabase: any;
  let mockToasterService: any;

  const mockControllerIp = '192.168.1.1';
  const mockControllerPort = 3080;
  const mockProjectId = 'project-123';

  beforeEach(async () => {
    vi.clearAllMocks();

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi
            .fn()
            .mockReturnValueOnce(mockControllerIp)
            .mockReturnValueOnce(mockControllerPort.toString())
            .mockReturnValueOnce(mockProjectId),
        },
      },
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockControllerService = {
      isServiceInitialized: false,
      serviceInitialized: {
        subscribe: vi.fn((callback) => {
          // Default: service already initialized, trigger callback immediately
          setTimeout(() => callback(true), 0);
          return { unsubscribe: vi.fn() };
        }),
      },
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'new-controller-id' }),
    };

    mockControllerDatabase = {};

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DirectLinkComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ControllerDatabase, useValue: mockControllerDatabase },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('protocols and locations', () => {
    it('should have correct protocols list', () => {
      expect(component.protocols).toHaveLength(2);
      expect(component.protocols[0]).toEqual({ key: 'http:', name: 'HTTP' });
      expect(component.protocols[1]).toEqual({ key: 'https:', name: 'HTTPS' });
    });

    it('should have correct locations list', () => {
      expect(component.locations).toHaveLength(2);
      expect(component.locations[0]).toEqual({ key: 'local', name: 'Local' });
      expect(component.locations[1]).toEqual({ key: 'remote', name: 'Remote' });
    });
  });

  describe('form rendering', () => {
    it('should render form with name, location, and protocol fields', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('input[formcontrolname="name"]')).toBeTruthy();
      expect(compiled.querySelector('mat-select[formcontrolname="location"]')).toBeTruthy();
      expect(compiled.querySelector('mat-select[formcontrolname="protocol"]')).toBeTruthy();
    });
  });

  describe('controller creation', () => {
    it('should show form when controller is not found', async () => {
      mockControllerService.isServiceInitialized = true;
      mockControllerService.findAll.mockResolvedValue([]);

      // Re-create component with the new mock
      fixture = TestBed.createComponent(DirectLinkComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.controllerOptionsVisibility()).toBe(true);
    });

    it('should navigate to controller page when controller is found', async () => {
      const existingController = {
        id: 'existing-controller-id',
        host: mockControllerIp,
        port: mockControllerPort,
      };
      mockControllerService.isServiceInitialized = true;
      mockControllerService.findAll.mockResolvedValue([existingController]);

      // Re-create component with the new mock
      fixture = TestBed.createComponent(DirectLinkComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        existingController.id,
        'project',
        mockProjectId,
      ]);
    });

    it('should create controller and navigate when form is valid', async () => {
      // Manually trigger getControllers to set projectId before testing createController
      component.projectId = mockProjectId;
      component.controllerIp = mockControllerIp;
      component.controllerPort = mockControllerPort;

      component.controllerForm.get('name')?.setValue('Test Controller');
      component.controllerForm.get('location')?.setValue('local');
      component.controllerForm.get('protocol')?.setValue('http:');

      await component.createController();

      expect(mockControllerService.create).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        'new-controller-id',
        'project',
        mockProjectId,
      ]);
    });
  });
});
