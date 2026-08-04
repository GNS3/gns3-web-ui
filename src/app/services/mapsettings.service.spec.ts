import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MapSettingsService } from './mapsettings.service';
import { ThemeService } from './theme.service';

describe('MapSettingsService', () => {
  let service: MapSettingsService;
  let mockLocalStorage: { [key: string]: string };
  let themeService: ThemeService;

  beforeEach(() => {
    mockLocalStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    });

    themeService = new ThemeService(document, 'indigo-pink');
    service = new MapSettingsService(themeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of MapSettingsService', () => {
      expect(service).toBeInstanceOf(MapSettingsService);
    });

    it('should initialize with default values', () => {
      expect(service.isTopologySummaryVisible).toBe(true);
      expect(service.isLogConsoleVisible).toBe(false);
      expect(service.showInterfaceLabels).toBe(true);
      expect(service.integrateLinkLabelsToLinks).toBe(true);
      expect(service.isItemLockStatusVisible).toBe(false);
    });

    it('should set symbolScaling default in localStorage', () => {
      expect(mockLocalStorage['symbolScaling']).toBe('true');
    });

    it('should set showInterfaceLabels default in localStorage', () => {
      expect(mockLocalStorage['showInterfaceLabels']).toBe('true');
    });
  });

  describe('getSymbolScaling', () => {
    it('should return true when set to true', () => {
      mockLocalStorage['symbolScaling'] = 'true';
      expect(service.getSymbolScaling()).toBe(true);
    });

    it('should return false when set to false', () => {
      mockLocalStorage['symbolScaling'] = 'false';
      expect(service.getSymbolScaling()).toBe(false);
    });

    it('should return false when not set', () => {
      delete mockLocalStorage['symbolScaling'];
      expect(service.getSymbolScaling()).toBe(false);
    });
  });

  describe('setSymbolScaling', () => {
    it('should set symbolScaling to true in localStorage', () => {
      service.setSymbolScaling(true);

      expect(mockLocalStorage['symbolScaling']).toBe('true');
    });

    it('should set symbolScaling to false in localStorage', () => {
      service.setSymbolScaling(false);

      expect(mockLocalStorage['symbolScaling']).toBe('false');
    });

    it('should emit on symbolScalingSubject', () => {
      let emittedValue: boolean | undefined;
      const subscription = service.symbolScalingSubject.subscribe((value) => {
        emittedValue = value;
      });

      service.setSymbolScaling(true);

      expect(emittedValue).toBe(true);
      subscription.unsubscribe();
    });
  });

  describe('changeMapLockValue', () => {
    it('should emit true on isMapLocked subject', () => {
      let emittedValue: boolean | undefined;
      const subscription = service.isMapLocked.subscribe((value) => {
        emittedValue = value;
      });

      service.changeMapLockValue(true);

      expect(emittedValue).toBe(true);
      subscription.unsubscribe();
    });

    it('should emit false on isMapLocked subject', () => {
      let emittedValue: boolean | undefined;
      const subscription = service.isMapLocked.subscribe((value) => {
        emittedValue = value;
      });

      service.changeMapLockValue(false);

      expect(emittedValue).toBe(false);
      subscription.unsubscribe();
    });
  });

  describe('setConsoleContextMenuAction', () => {
    it('should store action in localStorage', () => {
      service.setConsoleContextMenuAction('start');

      expect(mockLocalStorage['consoleContextMenu']).toBe('start');
    });
  });

  describe('getConsoleContextMenuAction', () => {
    it('should return stored action', () => {
      mockLocalStorage['consoleContextMenu'] = 'stop';

      const result = service.getConsoleContextMenuAction();

      expect(result).toBe('stop');
    });

    it('should return null when not set', () => {
      const result = service.getConsoleContextMenuAction();

      expect(result).toBeNull();
    });
  });

  describe('toggleTopologySummary', () => {
    it('should set isTopologySummaryVisible', () => {
      service.toggleTopologySummary(false);

      expect(service.isTopologySummaryVisible).toBe(false);
    });
  });

  describe('toggleLogConsole', () => {
    it('should set isLogConsoleVisible', () => {
      service.toggleLogConsole(true);

      expect(service.isLogConsoleVisible).toBe(true);
    });
  });

  describe('toggleLayers', () => {
    it('should set isLayerNumberVisible', () => {
      service.toggleLayers(true);

      expect(service.isLayerNumberVisible).toBe(true);
    });
  });

  describe('toggleItemLockStatus', () => {
    it('should set isItemLockStatusVisible', () => {
      service.toggleItemLockStatus(true);

      expect(service.isItemLockStatusVisible).toBe(true);
    });
  });

  describe('toggleShowInterfaceLabels', () => {
    it('should set showInterfaceLabels and update localStorage', () => {
      service.toggleShowInterfaceLabels(false);

      expect(service.showInterfaceLabels).toBe(false);
      expect(mockLocalStorage['showInterfaceLabels']).toBe('false');
    });
  });

  describe('toggleIntegrateInterfaceLabels', () => {
    it('should set integrateLinkLabelsToLinks and update localStorage', () => {
      service.toggleIntegrateInterfaceLabels(false);

      expect(service.integrateLinkLabelsToLinks).toBe(false);
      expect(mockLocalStorage['integrateLinkLabelsToLinks']).toBe('false');
    });
  });

  describe('toggleOpenReadme', () => {
    it('should set openReadme and update localStorage', () => {
      service.toggleOpenReadme(true);

      expect(service.openReadme).toBe(true);
      expect(mockLocalStorage['openReadme']).toBe('true');
    });
  });

  describe('toggleOpenConsolesInWidget', () => {
    it('should set openConsolesInWidget and update localStorage', () => {
      service.toggleOpenConsolesInWidget(true);

      expect(service.openConsolesInWidget).toBe(true);
      expect(mockLocalStorage['openConsolesInWidget']).toBe('true');
    });
  });

  describe('mapRenderedEmitter', () => {
    it('should be an EventEmitter', () => {
      expect(service.mapRenderedEmitter).toBeDefined();
    });

    it('should emit values', () => {
      let emittedValue: boolean | undefined;
      const subscription = service.mapRenderedEmitter.subscribe((value) => {
        emittedValue = value;
      });

      service.mapRenderedEmitter.emit(true);

      expect(emittedValue).toBe(true);
      subscription.unsubscribe();
    });
  });

  describe('isScrollDisabled', () => {
    it('should be a Subject', () => {
      expect(service.isScrollDisabled).toBeDefined();
    });

    it('should emit values', () => {
      let emittedValue: boolean | undefined;
      const subscription = service.isScrollDisabled.subscribe((value) => {
        emittedValue = value;
      });

      service.isScrollDisabled.next(true);

      expect(emittedValue).toBe(true);
      subscription.unsubscribe();
    });
  });

  describe('logConsoleSubject', () => {
    it('should be a Subject', () => {
      expect(service.logConsoleSubject).toBeDefined();
    });

    it('should emit values', () => {
      let emittedValue: boolean | undefined;
      const subscription = service.logConsoleSubject.subscribe((value) => {
        emittedValue = value;
      });

      service.logConsoleSubject.next(true);

      expect(emittedValue).toBe(true);
      subscription.unsubscribe();
    });
  });

  describe('Constructor - localStorage initialization', () => {
    it('should initialize isLayerNumberVisible from localStorage when set to true', () => {
      mockLocalStorage['layersVisibility'] = 'true';
      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.isLayerNumberVisible).toBe(true);
    });

    it('should initialize isLayerNumberVisible from localStorage when set to false', () => {
      mockLocalStorage['layersVisibility'] = 'false';
      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.isLayerNumberVisible).toBe(false);
    });

    it('should initialize openConsolesInWidget from localStorage when set to true', () => {
      mockLocalStorage['openConsolesInWidget'] = 'true';
      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.openConsolesInWidget).toBe(true);
    });

    it('should initialize openReadme from localStorage when set to true', () => {
      mockLocalStorage['openReadme'] = 'true';
      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.openReadme).toBe(true);
    });

    it('should default openReadme to false when not set', () => {
      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.openReadme).toBe(false);
    });
  });

  describe('getSymbolScaling edge cases', () => {
    it('should return false when localStorage contains invalid value', () => {
      mockLocalStorage['symbolScaling'] = 'invalid';
      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.getSymbolScaling()).toBe(false);
    });
  });

  describe('workspace style defaults', () => {
    it('should expose the established label, note, and link defaults', () => {
      expect(service.hasDefaultLabelStyle()).toBe(false);
      expect(service.hasDefaultLinkStyle()).toBe(false);
      expect(service.getDefaultLabelStyle()).toEqual({
        fontFamily: 'TypeWriter',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
      });
      expect(service.getDefaultNoteStyle()).toEqual({
        fontFamily: 'Noto Sans',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#000000',
      });
      expect(service.getDefaultLinkStyle()).toEqual({
        color: '#000000',
        width: 2,
        type: 1,
        link_type: 'straight',
      });
    });

    it('should keep unsaved style colors in sync with the active map theme', () => {
      vi.spyOn(themeService, 'getCanvasLabelColor').mockReturnValue('#ffffff');
      vi.spyOn(themeService, 'getCanvasLinkColor').mockReturnValue('#eeeeee');

      expect(service.getDefaultLabelStyle().color).toBe('#ffffff');
      expect(service.getDefaultNoteStyle().color).toBe('#ffffff');
      expect(service.getDefaultLinkStyle().color).toBe('#eeeeee');
    });

    it('should persist validated style defaults', () => {
      service.setDefaultLabelStyle({ fontFamily: 'Arial', fontSize: 12.5, fontWeight: 'normal', color: '#AABBCC' });
      service.setDefaultNoteStyle({ fontFamily: 'Verdana', fontSize: 14, fontWeight: 'bold', color: '#123456' });
      service.setDefaultLinkStyle({ color: '#FEDCBA', width: 4, type: 2, link_type: 'bezier' });

      expect(service.hasDefaultLabelStyle()).toBe(true);
      expect(service.hasDefaultLinkStyle()).toBe(true);
      expect(JSON.parse(mockLocalStorage['defaultLabelStyle'])).toEqual({
        fontFamily: 'Arial',
        fontSize: 12.5,
        fontWeight: 'normal',
        color: '#aabbcc',
      });
      expect(JSON.parse(mockLocalStorage['defaultNoteStyle']).color).toBe('#123456');
      expect(JSON.parse(mockLocalStorage['defaultLinkStyle'])).toEqual({
        color: '#fedcba',
        width: 4,
        type: 2,
        link_type: 'bezier',
      });
    });

    it('should sanitize malformed stored styles', () => {
      mockLocalStorage['defaultLabelStyle'] = JSON.stringify({
        fontFamily: 'url(javascript:alert(1))',
        fontSize: 999,
        fontWeight: 'invalid',
        color: 'red',
      });
      mockLocalStorage['defaultLinkStyle'] = JSON.stringify({
        color: 'invalid',
        width: -5,
        type: 99,
        link_type: 'invalid',
      });

      const serviceWithStorage = new MapSettingsService(themeService);

      expect(serviceWithStorage.getDefaultLabelStyle()).toEqual({
        fontFamily: 'TypeWriter',
        fontSize: 200,
        fontWeight: 'bold',
        color: '#000000',
      });
      expect(serviceWithStorage.getDefaultLinkStyle()).toEqual({
        color: '#000000',
        width: 1,
        type: 1,
        link_type: 'straight',
      });
    });

    it('should return copies so callers cannot mutate persisted defaults', () => {
      const labelStyle = service.getDefaultLabelStyle();
      labelStyle.color = '#ffffff';

      expect(service.getDefaultLabelStyle().color).toBe('#000000');
    });
  });
});
