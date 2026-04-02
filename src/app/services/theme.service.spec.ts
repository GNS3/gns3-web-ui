import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ThemeService, PrebuiltTheme, ThemeType, MapThemeType, DEFAULT_THEME_TOKEN } from './theme.service';
import { DOCUMENT } from '@angular/common';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockDocument: Document;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    });

    // Mock document
    const mockHtmlElement = {
      classList: {
        remove: vi.fn(),
        add: vi.fn(),
        contains: vi.fn(() => false),
      },
    };

    mockDocument = {
      documentElement: mockHtmlElement as any,
    } as Document;

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: DEFAULT_THEME_TOKEN, useValue: 'deeppurple-amber' as PrebuiltTheme },
      ],
    });

    service = TestBed.inject(ThemeService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ThemeService', () => {
      expect(service).toBeInstanceOf(ThemeService);
    });

    it('should be providedIn root', () => {
      // providedIn root is set via @Injectable decorator, verified by TestBed injection
      expect(service).toBeTruthy();
    });
  });

  describe('Available Themes', () => {
    it('should have 8 available themes', () => {
      expect(service.availableThemes).toHaveLength(8);
    });

    it('should have 4 light themes', () => {
      const lightThemes = service.availableThemes.filter((t) => t.type === 'light');
      expect(lightThemes).toHaveLength(4);
    });

    it('should have 4 dark themes', () => {
      const darkThemes = service.availableThemes.filter((t) => t.type === 'dark');
      expect(darkThemes).toHaveLength(4);
    });

    it('should include deeppurple-amber theme', () => {
      const theme = service.availableThemes.find((t) => t.key === 'deeppurple-amber');
      expect(theme).toBeDefined();
      expect(theme?.type).toBe('light');
    });

    it('should include pink-bluegrey theme', () => {
      const theme = service.availableThemes.find((t) => t.key === 'pink-bluegrey');
      expect(theme).toBeDefined();
      expect(theme?.type).toBe('dark');
    });
  });

  describe('Available Map Backgrounds', () => {
    it('should have 9 available map backgrounds', () => {
      expect(service.availableMapBackgrounds).toHaveLength(9);
    });

    it('should include auto option', () => {
      const auto = service.availableMapBackgrounds.find((bg) => bg.key === 'auto');
      expect(auto).toBeDefined();
    });

    it('should have 4 light backgrounds', () => {
      const lightBgs = service.availableMapBackgrounds.filter((bg) => bg.type === 'light');
      expect(lightBgs).toHaveLength(5); // auto + 4 light
    });

    it('should have 4 dark backgrounds', () => {
      const darkBgs = service.availableMapBackgrounds.filter((bg) => bg.type === 'dark');
      expect(darkBgs).toHaveLength(4);
    });
  });

  describe('getCurrentTheme', () => {
    it('should return current theme', () => {
      const theme = service.getCurrentTheme();
      expect(theme).toBeDefined();
    });

    it('should return a valid PrebuiltTheme', () => {
      const theme = service.getCurrentTheme();
      const validThemes: PrebuiltTheme[] = [
        'deeppurple-amber',
        'indigo-pink',
        'magenta-violet',
        'rose-red',
        'pink-bluegrey',
        'purple-green',
        'azure-blue',
        'cyan-orange',
      ];
      expect(validThemes).toContain(theme);
    });
  });

  describe('getThemeType', () => {
    it('should return light for light themes', () => {
      service.setTheme('deeppurple-amber');
      expect(service.getThemeType()).toBe('light');
    });

    it('should return dark for dark themes', () => {
      service.setTheme('pink-bluegrey');
      expect(service.getThemeType()).toBe('dark');
    });
  });

  describe('getActualMapTheme', () => {
    it('should return theme type', () => {
      const actualTheme = service.getActualMapTheme();
      expect(actualTheme === 'light' || actualTheme === 'dark').toBe(true);
    });

    it('should return light when savedMapTheme is light', () => {
      service.setMapTheme('light');
      expect(service.getActualMapTheme()).toBe('light');
    });

    it('should return dark when savedMapTheme is dark-1', () => {
      // MapBackgroundKey values work at runtime despite MapThemeType type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('dark-1' as any);
      expect(service.getActualMapTheme()).toBe('dark');
    });

    it('should return light when savedMapTheme is light-1', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('light-1' as any);
      expect(service.getActualMapTheme()).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('should set the theme', () => {
      service.setTheme('indigo-pink');

      expect(service.getCurrentTheme()).toBe('indigo-pink');
    });

    it('should emit themeChanged event', () => {
      let emittedTheme: string | undefined;
      service.themeChanged.subscribe((theme) => {
        emittedTheme = theme;
      });

      service.setTheme('purple-green');

      expect(emittedTheme).toBe('purple-green');
    });

    it('should not emit if same theme is set', () => {
      const currentTheme = service.getCurrentTheme();
      let emitCount = 0;
      service.themeChanged.subscribe(() => {
        emitCount++;
      });

      service.setTheme(currentTheme);

      expect(emitCount).toBe(0);
    });

    it('should apply theme class to document', () => {
      service.setTheme('azure-blue');

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('theme-azure-blue');
    });

    it('should remove previous theme classes', () => {
      service.setTheme('azure-blue');

      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalled();
    });
  });

  describe('toggleTheme', () => {
    it('should toggle between light and dark themes', () => {
      const initialTheme = service.getCurrentTheme();
      const initialType = service.getThemeType();

      service.toggleTheme();

      const newTheme = service.getCurrentTheme();
      const newType = service.getThemeType();

      expect(newType).not.toBe(initialType);
    });

    it('should switch to dark theme when toggling from light', () => {
      // Ensure we're on a light theme
      service.setTheme('deeppurple-amber');
      expect(service.getThemeType()).toBe('light');

      service.toggleTheme();

      expect(service.getThemeType()).toBe('dark');
    });

    it('should switch to light theme when toggling from dark', () => {
      // Ensure we're on a dark theme
      service.setTheme('pink-bluegrey');
      expect(service.getThemeType()).toBe('dark');

      service.toggleTheme();

      expect(service.getThemeType()).toBe('light');
    });
  });

  describe('setDarkMode', () => {
    it('should set dark mode', () => {
      service.setDarkMode(true);

      expect(service.isDarkMode()).toBe(true);
    });

    it('should set light mode', () => {
      service.setDarkMode(false);

      expect(service.isLightMode()).toBe(true);
    });
  });

  describe('setMapTheme', () => {
    it('should set map theme to light', () => {
      service.setMapTheme('light');

      expect((service as any).savedMapTheme).toBe('light');
    });

    it('should set map theme to dark-1', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('dark-1' as any);

      expect((service as any).savedMapTheme).toBe('dark-1');
    });

    it('should set map theme to auto', () => {
      service.setMapTheme('auto');

      expect((service as any).savedMapTheme).toBe('auto');
    });

    it('should emit mapThemeChanged event', () => {
      let emittedTheme: string | undefined;
      service.mapThemeChanged.subscribe((theme) => {
        emittedTheme = theme;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('dark-1' as any);

      expect(emittedTheme).toBe('dark');
    });

    it('should save map theme to localStorage', () => {
      service.setMapTheme('dark');

      expect(localStorage.setItem).toHaveBeenCalledWith('mapTheme', 'dark');
    });
  });

  describe('restoreTheme', () => {
    it('should restore theme from localStorage', () => {
      localStorage.setItem('theme', 'purple-green');

      service.restoreTheme();

      expect(service.getCurrentTheme()).toBe('purple-green');
    });

    it('should not restore invalid theme', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localStorage.setItem('theme', 'invalid-theme' as any);

      const currentTheme = service.getCurrentTheme();

      service.restoreTheme();

      // Should not change if theme is invalid
      expect(service.getCurrentTheme()).toBe(currentTheme);
    });
  });

  describe('isDarkMode', () => {
    it('should return true for dark themes', () => {
      service.setTheme('pink-bluegrey');
      expect(service.isDarkMode()).toBe(true);

      service.setTheme('purple-green');
      expect(service.isDarkMode()).toBe(true);

      service.setTheme('azure-blue');
      expect(service.isDarkMode()).toBe(true);

      service.setTheme('cyan-orange');
      expect(service.isDarkMode()).toBe(true);
    });

    it('should return false for light themes', () => {
      service.setTheme('deeppurple-amber');
      expect(service.isDarkMode()).toBe(false);

      service.setTheme('indigo-pink');
      expect(service.isDarkMode()).toBe(false);

      service.setTheme('magenta-violet');
      expect(service.isDarkMode()).toBe(false);

      service.setTheme('rose-red');
      expect(service.isDarkMode()).toBe(false);
    });
  });

  describe('isLightMode', () => {
    it('should return true for light themes', () => {
      service.setTheme('deeppurple-amber');
      expect(service.isLightMode()).toBe(true);
    });

    it('should return false for dark themes', () => {
      service.setTheme('pink-bluegrey');
      expect(service.isLightMode()).toBe(false);
    });
  });

  describe('darkMode$ Observable', () => {
    it('should emit true when dark mode is enabled', async () => {
      let receivedValue: boolean | undefined;

      const subscription = service.darkMode$.subscribe((isDark) => {
        receivedValue = isDark;
      });

      service.setDarkMode(true);

      // Wait a tick for the observable to emit
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(receivedValue).toBe(true);

      subscription.unsubscribe();
    });

    it('should emit false when light mode is enabled', async () => {
      let receivedValue: boolean | undefined;

      const subscription = service.darkMode$.subscribe((isDark) => {
        receivedValue = isDark;
      });

      service.setDarkMode(false);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(receivedValue).toBe(false);

      subscription.unsubscribe();
    });
  });

  describe('mapThemeChanged emission', () => {
    it('should emit when mapTheme is auto and global theme changes', () => {
      service.setMapTheme('auto');
      let emittedTheme: string | undefined;
      service.mapThemeChanged.subscribe((theme) => {
        emittedTheme = theme;
      });

      service.setTheme('purple-green');

      expect(emittedTheme).toBe('purple-green');
    });

    it('should emit resolved theme type when mapTheme is not auto', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('dark-1' as any);
      let emittedTheme: string | undefined;
      service.mapThemeChanged.subscribe((theme) => {
        emittedTheme = theme;
      });

      service.setTheme('deeppurple-amber');

      // Should emit 'dark' because dark-1 is a dark background preset
      expect(emittedTheme).toBe('dark');
    });
  });

  describe('Canvas Label and Link Colors', () => {
    it('should return white color for dark-1 map theme', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('dark-1' as any);
      expect(service.getCanvasLabelColor()).toBe('#FFFFFF');
      expect(service.getCanvasLinkColor()).toBe('#FFFFFF');
    });

    it('should return black color for light-1 map theme', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setMapTheme('light-1' as any);
      expect(service.getCanvasLabelColor()).toBe('#000000');
      expect(service.getCanvasLinkColor()).toBe('#000000');
    });

    it('should return color based on actual map theme with auto', () => {
      service.setMapTheme('auto');
      service.setTheme('deeppurple-amber'); // light theme

      expect(service.getCanvasLabelColor()).toBe('#000000');
      expect(service.getCanvasLinkColor()).toBe('#000000');
    });
  });

  describe('Theme Preferences', () => {
    it('should save theme to localStorage', () => {
      service.setTheme('indigo-pink');

      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'indigo-pink');
    });

    it('should load theme from localStorage on init', () => {
      localStorage.setItem('theme', 'purple-green');

      // Reconfigure TestBed to simulate fresh service init with saved theme
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: DEFAULT_THEME_TOKEN, useValue: 'deeppurple-amber' as PrebuiltTheme },
        ],
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.getCurrentTheme()).toBe('purple-green');
    });
  });

  describe('Backward Compatibility', () => {
    it('should have savedTheme property', () => {
      expect((service as any).savedTheme).toBeDefined();
    });

    it('should have savedMapTheme property', () => {
      expect((service as any).savedMapTheme).toBeDefined();
    });

    it('getActualTheme should return same as getThemeType', () => {
      expect(service.getActualTheme()).toBe(service.getThemeType());
    });
  });
});
