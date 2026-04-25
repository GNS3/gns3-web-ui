import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VpcsPreferencesComponent } from './vpcs-preferences.component';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VpcsPreferencesComponent', () => {
  let fixture: ComponentFixture<VpcsPreferencesComponent>;
  let component: VpcsPreferencesComponent;
  let mockControllerService: any;
  let mockActivatedRoute: any;
  let mockToasterService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '/',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    authToken: '',
    tokenExpired: false,
  };

  beforeEach(async () => {
    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VpcsPreferencesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VpcsPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.runAllTimers();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller with id from route param', () => {
      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should store controller after successful fetch', () => {
      expect(component.controller).toEqual(mockController);
    });
  });

  describe('Template', () => {
    it('should display VPCS preferences header', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('h1');
      expect(header?.textContent).toContain('VPCS preferences');
    });

    it('should display vpcs executable input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('input[placeholder="Path to VPCS executable"]');
      expect(input).toBeTruthy();
    });

    it('should update vpcsExecutable when user types in input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('input') as HTMLInputElement;

      input.value = '/custom/path/vpcs';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.vpcsExecutable()).toBe('/custom/path/vpcs');
    });
  });

  describe('restoreDefaults', () => {
    it('should clear vpcsExecutable', () => {
      component.vpcsExecutable.set('/some/path/vpcs');
      fixture.detectChanges();

      component.restoreDefaults();
      fixture.detectChanges();

      expect(component.vpcsExecutable()).toBe('');
    });
  });

  describe('error handling', () => {
    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(VpcsPreferencesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(VpcsPreferencesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });
  });
});
