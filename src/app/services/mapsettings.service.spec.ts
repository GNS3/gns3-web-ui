import { describe, it, expect, beforeEach, vi } from 'vitest';
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
      service.symbolScalingSubject.subscribe((value) => {
        emittedValue = value;
      });

      service.setSymbolScaling(true);

      expect(emittedValue).toBe(true);
    });
  });

  describe('changeMapLockValue', () => {
    it('should emit on isMapLocked subject', () => {
      let emittedValue: boolean | undefined;
      service.isMapLocked.subscribe((value) => {
        emittedValue = value;
      });

      service.changeMapLockValue(true);

      expect(emittedValue).toBe(true);
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
      service.mapRenderedEmitter.subscribe((value) => {
        emittedValue = value;
      });

      service.mapRenderedEmitter.emit(true);

      expect(emittedValue).toBe(true);
    });
  });

  describe('isScrollDisabled', () => {
    it('should be a Subject', () => {
      expect(service.isScrollDisabled).toBeDefined();
    });

    it('should emit values', () => {
      let emittedValue: boolean | undefined;
      service.isScrollDisabled.subscribe((value) => {
        emittedValue = value;
      });

      service.isScrollDisabled.next(true);

      expect(emittedValue).toBe(true);
    });
  });
});
