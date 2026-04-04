import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { BundledControllerFinderComponent } from './bundled-controller-finder.component';
import { ProgressService } from '../../common/progress/progress.service';
import { ControllerService } from '@services/controller.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BundledControllerFinderComponent', () => {
  let fixture: ComponentFixture<BundledControllerFinderComponent>;
  let mockRouter: any;
  let mockControllerService: any;
  let mockProgressService: any;
  let mockStateSubject: Subject<any>;

  const mockController: Controller = {
    authToken: '',
    id: 42,
    name: 'local',
    location: 'bundled',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock state subject for ProgressService
    mockStateSubject = new Subject<any>();

    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
      state: mockStateSubject.asObservable(),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
      events: new Subject<RouterEvent>(),
      url: '/some-url',
    };

    mockControllerService = {
      getLocalController: vi.fn().mockResolvedValue(mockController),
    };

    await TestBed.configureTestingModule({
      imports: [BundledControllerFinderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideProvider(ProgressService, { useValue: mockProgressService })
      .overrideProvider(Router, { useValue: mockRouter })
      .overrideProvider(ControllerService, { useValue: mockControllerService })
      .compileComponents();

    fixture = TestBed.createComponent(BundledControllerFinderComponent);
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    // Clean up router events subject
    if (mockRouter?.events) {
      (mockRouter.events as Subject<RouterEvent>).complete();
    }
  });

  describe('rendering', () => {
    it('should render app-progress element', () => {
      fixture.detectChanges();
      const progressEl = fixture.nativeElement.querySelector('app-progress');
      expect(progressEl).not.toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should activate progress service on init', () => {
      fixture.detectChanges();
      expect(mockProgressService.activate).toHaveBeenCalledTimes(1);
    });

    it('should call getLocalController with hostname and port from document location', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      // getLocalController is called with the hostname and port from document.location
      expect(mockControllerService.getLocalController).toHaveBeenCalled();
      const [host, port] = mockControllerService.getLocalController.mock.calls[0];
      expect(typeof host).toBe('string');
      expect(typeof port).toBe('number');
    });

    it('should navigate to controller projects page on success', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 42, 'projects']);
    });

    it('should deactivate progress service after successful navigation', async () => {
      fixture.detectChanges();
      await vi.runAllTimersAsync();
      expect(mockProgressService.deactivate).toHaveBeenCalledTimes(1);
    });
  });
});
