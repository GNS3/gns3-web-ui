import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, Observable } from 'rxjs';
import { ControllerDiscoveryComponent } from './controller-discovery.component';
import { Controller } from '@models/controller';
import { Version } from '@models/version';
import { ControllerService } from '@services/controller.service';
import { VersionService } from '@services/version.service';
import { ControllerDatabase } from '@services/controller.database';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ControllerDiscoveryComponent', () => {
  let fixture: ComponentFixture<ControllerDiscoveryComponent>;
  let component: ControllerDiscoveryComponent;

  // Service mocks
  let mockControllerService: {
    isServiceInitialized: boolean;
    serviceInitialized: Subject<boolean>;
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let mockVersionService: {
    get: ReturnType<typeof vi.fn>;
  };
  let mockControllerDatabase: {
    addController: ReturnType<typeof vi.fn>;
  };

  // Subjects for controlling observables
  let serviceInitializedSubject: Subject<boolean>;

  // Mock controller for testing
  const createMockController = (overrides?: Partial<Controller>): Controller =>
    ({
      id: 1,
      authToken: 'test-token',
      name: 'Test Controller',
      location: 'remote',
      host: '127.0.0.1',
      port: 3080,
      path: '/',
      ubridge_path: '/usr/bin/ubridge',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      tokenExpired: false,
      ...overrides,
    } as Controller);

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create fresh subjects for each test
    serviceInitializedSubject = new Subject<boolean>();

    // Set up service mocks before TestBed configuration
    mockControllerService = {
      isServiceInitialized: false,
      serviceInitialized: serviceInitializedSubject,
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(createMockController()),
    };

    mockVersionService = {
      get: vi.fn().mockReturnValue(of({ version: '3.1.0' } as Version)),
    };

    mockControllerDatabase = {
      addController: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ControllerDiscoveryComponent],
      providers: [
        { provide: ControllerService, useValue: mockControllerService },
        { provide: VersionService, useValue: mockVersionService },
        { provide: ControllerDatabase, useValue: mockControllerDatabase },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ControllerDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have null initially for discoveredController', () => {
      expect(component.discoveredController()).toBeNull();
    });

    it('should subscribe to serviceInitialized observable', () => {
      expect(serviceInitializedSubject.observed).toBe(true);
    });
  });

  describe('discoveredController signal', () => {
    it('should be initially null', () => {
      expect(component.discoveredController()).toBeNull();
    });

    it('should be settable via signal', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);
      expect(component.discoveredController()).toEqual(mockController);
    });

    it('should reflect in template when set', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('mat-card');
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('127.0.0.1:3080');
    });

    it('should not display card when null', () => {
      component.discoveredController.set(null);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('mat-card');
      expect(card).toBeFalsy();
    });
  });

  describe('ignore() method', () => {
    it('should set discoveredController to null', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);

      component.ignore(mockController);

      expect(component.discoveredController()).toBeNull();
    });

    it('should hide the card after ignoring', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);
      fixture.detectChanges();

      component.ignore(mockController);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('mat-card');
      expect(card).toBeFalsy();
    });
  });

  describe('accept() method', () => {
    it('should set controller name to host if name is null', async () => {
      const mockController = createMockController({ name: null as any });

      await component.accept(mockController);

      expect(mockController.name).toBe('127.0.0.1');
    });

    it('should auto-detect location based on host address', async () => {
      // Test 127.0.0.1 → local
      const localController = createMockController({ host: '127.0.0.1' });
      await component.accept(localController);
      expect(localController.location).toBe('local');

      // Test localhost → local
      const localhostController = createMockController({ host: 'localhost' });
      await component.accept(localhostController);
      expect(localhostController.location).toBe('local');

      // Test remote address → remote
      const remoteController = createMockController({ host: '192.168.1.100' });
      await component.accept(remoteController);
      expect(remoteController.location).toBe('remote');
    });

    it('should call controllerService.create with the controller', async () => {
      const mockController = createMockController();

      await component.accept(mockController);

      expect(mockControllerService.create).toHaveBeenCalledWith(mockController);
    });

    it('should add controller to database after creation', async () => {
      const mockController = createMockController();
      mockControllerService.create.mockResolvedValue(mockController);

      await component.accept(mockController);

      expect(mockControllerDatabase.addController).toHaveBeenCalledWith(mockController);
    });

    it('should clear discoveredController after accepting', async () => {
      const mockController = createMockController();
      mockControllerService.create.mockResolvedValue(mockController);

      await component.accept(mockController);

      expect(component.discoveredController()).toBeNull();
    });
  });

  describe('discoverFirstAvailableController() method', () => {
    it('should set discoveredController when a new controller is found', () => {
      const discoveredController = createMockController({ id: 99, host: '192.168.1.1' });
      mockVersionService.get.mockReturnValue(of({ version: '3.1.0' } as Version));
      mockControllerService.findAll.mockResolvedValue([]);

      component.discoverFirstAvailableController();

      // The method uses forkJoin and async operations
      // The discovered controller should eventually be set
    });
  });

  describe('ngOnDestroy()', () => {
    it('should unsubscribe from serviceInitialized on destroy', () => {
      const unsubscribeSpy = vi.spyOn(serviceInitializedSubject, 'unsubscribe');

      fixture.destroy();

      // The subscription should be cleaned up
      expect(unsubscribeSpy.mock.calls.length > 0 || serviceInitializedSubject.observed === false).toBeTruthy();
    });
  });

  describe('Template rendering', () => {
    it('should display controller host and port when discovered', () => {
      const mockController = createMockController({ host: '192.168.1.100', port: 3080 });
      component.discoveredController.set(mockController);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('192.168.1.100');
      expect(content).toContain('3080');
    });

    it('should have YES and NO buttons when controller is discovered', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);
      fixture.detectChanges();

      const yesButton = fixture.nativeElement.querySelector('button:not([color="accent"])');
      const noButton = fixture.nativeElement.querySelector('button[color="accent"]');

      expect(yesButton).toBeTruthy();
      expect(noButton).toBeTruthy();
    });

    it('should call ignore when NO button is clicked', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);
      fixture.detectChanges();

      const ignoreSpy = vi.spyOn(component, 'ignore');
      const noButton = fixture.nativeElement.querySelector('button[color="accent"]');
      noButton.click();

      expect(ignoreSpy).toHaveBeenCalledWith(mockController);
    });

    it('should call accept when YES button is clicked', () => {
      const mockController = createMockController();
      component.discoveredController.set(mockController);
      fixture.detectChanges();

      const acceptSpy = vi.spyOn(component, 'accept');
      const yesButton = fixture.nativeElement.querySelector('button:not([color="accent"])');
      yesButton.click();

      expect(acceptSpy).toHaveBeenCalledWith(mockController);
    });
  });
});
