import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { SettingsService, Settings } from '@services/settings.service';
import { ThemeService, PrebuiltTheme } from '@services/theme.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { ToasterService } from '@services/toaster.service';
import { UpdatesService } from '@services/updates.service';
import { ControllerService } from '@services/controller.service';
import { InterfaceDensityService } from '@services/interface-density.service';
import { AiChatService } from '@services/ai-chat.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let mockSettingsService: any;
  let mockThemeService: any;
  let mockMapSettingsService: any;
  let mockToasterService: any;
  let mockUpdatesService: any;
  let mockControllerService: any;
  let mockInterfaceDensityService: any;
  let mockAiChatService: any;
  let mockActivatedRoute: any;
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
      getDefaultSceneWidth: vi.fn().mockReturnValue(2000),
      setDefaultSceneWidth: vi.fn(),
      getDefaultSceneHeight: vi.fn().mockReturnValue(1000),
      setDefaultSceneHeight: vi.fn(),
      getDefaultGridSize: vi.fn().mockReturnValue(75),
      setDefaultGridSize: vi.fn(),
      getDefaultDrawingGridSize: vi.fn().mockReturnValue(25),
      setDefaultDrawingGridSize: vi.fn(),
      getDefaultShowGrid: vi.fn().mockReturnValue(false),
      setDefaultShowGrid: vi.fn(),
      getDefaultSnapToGrid: vi.fn().mockReturnValue(false),
      setDefaultSnapToGrid: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
    };

    mockUpdatesService = {};

    mockControllerService = {
      get: vi.fn().mockResolvedValue({
        controller_id: 1,
      }),
    };

    mockInterfaceDensityService = {
      getDensity: vi.fn().mockReturnValue('normal'),
      setDensity: vi.fn(),
    };

    mockAiChatService = {
      reloadSkills: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockImplementation((callbacks) => {
          callbacks.next();
          callbacks.complete();
        }),
      }),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: UpdatesService, useValue: mockUpdatesService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: InterfaceDensityService, useValue: mockInterfaceDensityService },
        { provide: AiChatService, useValue: mockAiChatService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
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

  describe('saveSettings', () => {
    it('should save settings via SettingsService', () => {
      // Mark a settings field dirty so saveSettings() actually persists
      // (the real saveSettings gates settingsService.setAll on dirtyFields).
      component.setCrashReports(true);
      component.saveSettings();
      expect(mockSettingsService.setAll).toHaveBeenCalled();
    });

    it('should show success toaster message', () => {
      component.saveSettings();
      expect(mockToasterService.success).toHaveBeenCalledWith('Settings saved');
    });

    it('should toggle map settings', () => {
      // Use the setters so the dirty flag is marked, mirroring real UI flow;
      // the mock mapSettingsService defaults are
      // integrateLinkLabelsToLinks: true, openReadme: false,
      // openConsolesInWidget: false.
      component.setIntegrateLinkLabels(false);
      component.setOpenReadme(true);
      component.setOpenConsolesInWidget(true);

      component.saveSettings();

      expect(mockMapSettingsService.toggleIntegrateInterfaceLabels).toHaveBeenCalledWith(false);
      expect(mockMapSettingsService.toggleOpenReadme).toHaveBeenCalledWith(true);
      expect(mockMapSettingsService.toggleOpenConsolesInWidget).toHaveBeenCalledWith(true);
    });

    it('should persist workspace defaults via MapSettingsService when a default changes', () => {
      // Toggle a controller-backed default dirty so saveSettings writes
      // it through MapSettingsService (the workspace-defaults persistence
      // layer — same store existing workspace prefs use).
      component.setDefaultShowGrid(true);
      component.setDefaultSnapToGrid(true);
      component.setDefaultSceneWidth(2200);
      component.saveSettings();

      expect(mockMapSettingsService.setDefaultShowGrid).toHaveBeenCalledWith(true);
      expect(mockMapSettingsService.setDefaultSnapToGrid).toHaveBeenCalledWith(true);
      expect(mockMapSettingsService.setDefaultSceneWidth).toHaveBeenCalledWith(2200);
    });

    it('should persist default drawing grid size via MapSettingsService (local prefs)', () => {
      component.setDefaultDrawingGridSize(40);
      component.saveSettings();
      expect(mockMapSettingsService.setDefaultDrawingGridSize).toHaveBeenCalledWith(40);
    });
  });

  describe('workspace defaults setters', () => {
    it('setDefaultSceneWidth should update the model and mark dirty', () => {
      component.setDefaultSceneWidth(1700);
      expect(component.defaultSceneWidth()).toBe(1700);
      expect(component.isDirty()).toBe(true);
    });

    it('setDefaultSceneHeight should clamp non-negative integers', () => {
      component.setDefaultSceneHeight(-50 as any);
      expect(component.defaultSceneHeight()).toBe(0);
    });

    it('setDefaultGridSize should round to nearest integer', () => {
      component.setDefaultGridSize(73.6);
      expect(component.defaultGridSize()).toBe(74);
    });

    it('setDefaultShowGrid should update the model', () => {
      component.setDefaultShowGrid(true);
      expect(component.defaultShowGrid()).toBe(true);
    });

    it('setDefaultSnapToGrid should update the model', () => {
      component.setDefaultSnapToGrid(true);
      expect(component.defaultSnapToGrid()).toBe(true);
    });

    it('ngOnInit should seed defaults from MapSettingsService', () => {
      // Mock getters return scene_width=2000, scene_height=1000, grid_size=75,
      // drawing_grid_size=25, show_grid=false, snap_to_grid=false (set above).
      expect(component.defaultSceneWidth()).toBe(2000);
      expect(component.defaultSceneHeight()).toBe(1000);
      expect(component.defaultGridSize()).toBe(75);
      expect(component.defaultDrawingGridSize()).toBe(25);
      expect(component.defaultShowGrid()).toBe(false);
      expect(component.defaultSnapToGrid()).toBe(false);
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
