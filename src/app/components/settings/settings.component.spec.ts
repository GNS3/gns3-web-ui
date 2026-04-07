import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { SettingsService, Settings } from '@services/settings.service';
import { ThemeService, PrebuiltTheme } from '@services/theme.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { ToasterService } from '@services/toaster.service';
import { UpdatesService } from '@services/updates.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let mockSettingsService: any;
  let mockThemeService: any;
  let mockMapSettingsService: any;
  let mockToasterService: any;
  let mockUpdatesService: any;
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  const mockSettings: Settings = {
    crash_reports: true,
    console_command: 'telnet',
    anonymous_statistics: false,
  };

  const mockThemes = [
    { key: 'deeppurple-amber' as PrebuiltTheme, label: 'Deep Purple & Amber', type: 'light', primaryColor: '#6750A4' },
    { key: 'pink-bluegrey' as PrebuiltTheme, label: 'Pink & Bluegrey', type: 'dark', primaryColor: '#E91E63' },
  ];

  const mockMapBackgrounds = [
    { key: 'auto' as const, label: 'Follow global theme', background: '', textColor: '', type: 'light' as const },
    {
      key: 'light-1' as const,
      label: 'Cyan Sky',
      background: 'radial-gradient(...)',
      textColor: '#006064',
      type: 'light' as const,
    },
    {
      key: 'dark-1' as const,
      label: 'Deep Cyan',
      background: 'linear-gradient(...)',
      textColor: '#FFFFFF',
      type: 'dark' as const,
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    mockSettingsService = {
      getAll: vi.fn().mockReturnValue({ ...mockSettings }),
      setAll: vi.fn(),
    };

    mockThemeService = {
      availableThemes: mockThemes,
      availableMapBackgrounds: mockMapBackgrounds,
      savedMapTheme: 'auto',
      getCurrentTheme: vi.fn().mockReturnValue('deeppurple-amber'),
      setTheme: vi.fn(),
      setMapTheme: vi.fn(),
    };

    mockMapSettingsService = {
      integrateLinkLabelsToLinks: true,
      openReadme: false,
      openConsolesInWidget: false,
      toggleIntegrateInterfaceLabels: vi.fn(),
      toggleOpenReadme: vi.fn(),
      toggleOpenConsolesInWidget: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
    };

    mockUpdatesService = {};

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: UpdatesService, useValue: mockUpdatesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    windowOpenSpy?.mockRestore();
  });

  describe('ngOnInit', () => {
    it('should initialize settings from SettingsService', () => {
      expect(mockSettingsService.getAll).toHaveBeenCalled();
      expect(component.settings).toEqual(mockSettings);
    });

    it('should initialize map settings properties', () => {
      expect(component.integrateLinksLabelsToLinks()).toBe(true);
      expect(component.openReadme()).toBe(false);
      expect(component.openConsolesInWidget()).toBe(false);
    });

    it('should initialize theme settings', () => {
      expect(component.mapTheme).toBe('auto');
      expect(component.currentTheme).toBe('deeppurple-amber');
    });
  });

  describe('lightThemes getter', () => {
    it('should return only light themes', () => {
      const lightThemes = component.lightThemes;
      expect(lightThemes).toHaveLength(1);
      expect(lightThemes[0].type).toBe('light');
    });
  });

  describe('darkThemes getter', () => {
    it('should return only dark themes', () => {
      const darkThemes = component.darkThemes;
      expect(darkThemes).toHaveLength(1);
      expect(darkThemes[0].type).toBe('dark');
    });
  });

  describe('lightMapBackgrounds getter', () => {
    it('should return only light map backgrounds excluding auto', () => {
      const backgrounds = component.lightMapBackgrounds;
      expect(backgrounds.every((bg) => bg.type === 'light' && bg.key !== 'auto')).toBe(true);
    });
  });

  describe('darkMapBackgrounds getter', () => {
    it('should return only dark map backgrounds', () => {
      const backgrounds = component.darkMapBackgrounds;
      expect(backgrounds.every((bg) => bg.type === 'dark')).toBe(true);
    });
  });

  describe('autoMapBackground getter', () => {
    it('should return the auto map background preset', () => {
      const autoBackground = component.autoMapBackground;
      expect(autoBackground?.key).toBe('auto');
    });
  });

  describe('save', () => {
    it('should save settings via SettingsService', () => {
      component.save();
      expect(mockSettingsService.setAll).toHaveBeenCalledWith(mockSettings);
    });

    it('should show success toaster message', () => {
      component.save();
      expect(mockToasterService.success).toHaveBeenCalledWith('Settings have been saved.');
    });

    it('should toggle map settings', () => {
      component.integrateLinksLabelsToLinks.set(false);
      component.openReadme.set(true);
      component.openConsolesInWidget.set(true);

      component.save();

      expect(mockMapSettingsService.toggleIntegrateInterfaceLabels).toHaveBeenCalledWith(false);
      expect(mockMapSettingsService.toggleOpenReadme).toHaveBeenCalledWith(true);
      expect(mockMapSettingsService.toggleOpenConsolesInWidget).toHaveBeenCalledWith(true);
    });
  });

  describe('setTheme', () => {
    it('should call themeService.setTheme with the selected theme', () => {
      const newTheme: PrebuiltTheme = 'pink-bluegrey';
      component.setTheme(newTheme);
      expect(mockThemeService.setTheme).toHaveBeenCalledWith(newTheme);
    });

    it('should update currentTheme property', () => {
      const newTheme: PrebuiltTheme = 'pink-bluegrey';
      component.setTheme(newTheme);
      expect(component.currentTheme).toBe(newTheme);
    });
  });

  describe('setMapTheme', () => {
    it('should update mapTheme property', () => {
      component.setMapTheme('dark');
      expect(component.mapTheme).toBe('dark');
    });

    it('should call themeService.setMapTheme', () => {
      component.setMapTheme('dark');
      expect(mockThemeService.setMapTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('checkForUpdates', () => {
    it('should open updates URL in new window', () => {
      component.checkForUpdates();
      expect(windowOpenSpy).toHaveBeenCalledWith('https://gns3.com/software');
    });
  });

  describe('availableThemes and availableMapBackgrounds', () => {
    it('should expose availableThemes from themeService', () => {
      expect(component.availableThemes).toBe(mockThemes);
    });

    it('should expose availableMapBackgrounds from themeService', () => {
      expect(component.availableMapBackgrounds).toBe(mockMapBackgrounds);
    });
  });
});
