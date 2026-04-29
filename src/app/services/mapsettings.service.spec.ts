import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MapSettingsService } from './mapsettings.service';

describe('MapSettingsService', () => {
  let service: MapSettingsService;
  let mockLocalStorage: { [key: string]: string };

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

    service = new MapSettingsService();
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
      const serviceWithStorage = new MapSettingsService();

      expect(serviceWithStorage.isLayerNumberVisible).toBe(true);
    });

    it('should initialize isLayerNumberVisible from localStorage when set to false', () => {
      mockLocalStorage['layersVisibility'] = 'false';
      const serviceWithStorage = new MapSettingsService();

      expect(serviceWithStorage.isLayerNumberVisible).toBe(false);
    });

    it('should initialize openConsolesInWidget from localStorage when set to true', () => {
      mockLocalStorage['openConsolesInWidget'] = 'true';
      const serviceWithStorage = new MapSettingsService();

      expect(serviceWithStorage.openConsolesInWidget).toBe(true);
    });

    it('should initialize openReadme from localStorage when set to true', () => {
      mockLocalStorage['openReadme'] = 'true';
      const serviceWithStorage = new MapSettingsService();

      expect(serviceWithStorage.openReadme).toBe(true);
    });

    it('should default openReadme to false when not set', () => {
      const serviceWithStorage = new MapSettingsService();

      expect(serviceWithStorage.openReadme).toBe(false);
    });
  });

  describe('getSymbolScaling edge cases', () => {
    it('should return false when localStorage contains invalid value', () => {
      mockLocalStorage['symbolScaling'] = 'invalid';
      const serviceWithStorage = new MapSettingsService();

      expect(serviceWithStorage.getSymbolScaling()).toBe(false);
    });
  });
});
