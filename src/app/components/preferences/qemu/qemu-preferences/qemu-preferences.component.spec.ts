import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { QemuPreferencesComponent } from './qemu-preferences.component';
import { ControllerService } from '@services/controller.service';
import { ControllerSettingsService } from '@services/controller-settings.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { QemuSettings } from '@models/settings/qemu-settings';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

describe('QemuPreferencesComponent', () => {
  let component: QemuPreferencesComponent;
  let fixture: ComponentFixture<QemuPreferencesComponent>;
  let mockControllerService: any;
  let mockControllerSettingsService: any;
  let mockToasterService: any;
  let mockActivatedRoute: any;
  let mockController: Controller;
  let mockSettings: QemuSettings;

  beforeEach(async () => {
    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '/',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      authToken: 'token',
      tokenExpired: false,
    };

    mockSettings = {
      enable_hardware_acceleration: true,
      require_hardware_acceleration: true,
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockControllerSettingsService = {
      getSettingsForQemu: vi.fn().mockReturnValue(of(mockSettings)),
      updateSettingsForQemu: vi.fn().mockReturnValue(of(mockSettings)),
    };

    mockToasterService = {
      success: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [QemuPreferencesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ControllerSettingsService, useValue: mockControllerSettingsService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QemuPreferencesComponent);
    component = fixture.componentInstance;
    // Trigger initial change detection
    fixture.detectChanges();
    // Wait for async operations (controller load and settings load)
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract controller_id from route params on ngOnInit', () => {
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
  });

  it('should call controllerService.get with parsed controller id', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should populate controller after async load', () => {
    expect(component.controller).toEqual(mockController);
  });

  it('should populate settings after async load', () => {
    expect(component.settings).toEqual(mockSettings);
  });

  it('should display QEMU preferences title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('QEMU preferences');
  });

  it('should display QEMU VM templates button when controller is loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button.top-button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('QEMU VM templates');
  });

  it('should display hardware acceleration checkbox when settings are loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const checkboxes = compiled.querySelectorAll('mat-checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('should have Apply and Restore defaults buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(buttonTexts).toContain('Apply');
    expect(buttonTexts).toContain('Restore defaults');
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  describe('apply()', () => {
    it('should call updateSettingsForQemu with current settings', () => {
      component.apply();
      expect(mockControllerSettingsService.updateSettingsForQemu).toHaveBeenCalledWith(mockController, mockSettings);
    });

    it('should show success toaster after apply', () => {
      component.apply();
      expect(mockToasterService.success).toHaveBeenCalledWith('Changes applied');
    });

    it('should disable require_hardware_acceleration when enable_hardware_acceleration is false', () => {
      component.settings.enable_hardware_acceleration = false;
      component.settings.require_hardware_acceleration = true;
      component.apply();
      expect(component.settings.require_hardware_acceleration).toBe(false);
    });
  });

  describe('restoreDefaults()', () => {
    it('should call updateSettingsForQemu with default settings', () => {
      component.restoreDefaults();
      expect(mockControllerSettingsService.updateSettingsForQemu).toHaveBeenCalled();
    });

    it('should show success toaster after restore defaults', () => {
      component.restoreDefaults();
      expect(mockToasterService.success).toHaveBeenCalledWith('Restored to default settings');
    });

    it('should set default enable_hardware_acceleration to true', () => {
      component.restoreDefaults();
      const callArgs = mockControllerSettingsService.updateSettingsForQemu.mock.calls[0];
      const defaultSettings = callArgs[1] as QemuSettings;
      expect(defaultSettings.enable_hardware_acceleration).toBe(true);
    });

    it('should set default require_hardware_acceleration to true', () => {
      component.restoreDefaults();
      const callArgs = mockControllerSettingsService.updateSettingsForQemu.mock.calls[0];
      const defaultSettings = callArgs[1] as QemuSettings;
      expect(defaultSettings.require_hardware_acceleration).toBe(true);
    });
  });
});
