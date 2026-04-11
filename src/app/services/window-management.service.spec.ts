import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WindowManagementService, MinimizedWindow } from './window-management.service';

describe('WindowManagementService', () => {
  let service: WindowManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WindowManagementService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of WindowManagementService', () => {
      expect(service).toBeInstanceOf(WindowManagementService);
    });

    it('should have empty minimizedWindows by default', () => {
      expect(service.minimizedWindows()).toEqual([]);
    });
  });

  describe('minimizeWindow', () => {
    it('should add window to minimized list', () => {
      service.minimizeWindow('window-1', 'console');

      expect(service.minimizedWindows()).toHaveLength(1);
      expect(service.minimizedWindows()[0]).toEqual({
        id: 'window-1',
        type: 'console',
        linkId: undefined,
      });
    });

    it('should add window with linkId', () => {
      service.minimizeWindow('wireshark-1', 'wireshark', 'link-123');

      expect(service.minimizedWindows()).toHaveLength(1);
      expect(service.minimizedWindows()[0]).toEqual({
        id: 'wireshark-1',
        type: 'wireshark',
        linkId: 'link-123',
      });
    });

    it('should not add duplicate window', () => {
      service.minimizeWindow('window-1', 'console');
      service.minimizeWindow('window-1', 'console');

      expect(service.minimizedWindows()).toHaveLength(1);
    });

    it('should allow different windows to be minimized', () => {
      service.minimizeWindow('window-1', 'console');
      service.minimizeWindow('window-2', 'wireshark');

      expect(service.minimizedWindows()).toHaveLength(2);
    });
  });

  describe('restoreWindow', () => {
    it('should remove window from minimized list', () => {
      service.minimizeWindow('window-1', 'console');
      service.restoreWindow('window-1');

      expect(service.minimizedWindows()).toHaveLength(0);
    });

    it('should only remove specified window', () => {
      service.minimizeWindow('window-1', 'console');
      service.minimizeWindow('window-2', 'wireshark');
      service.restoreWindow('window-1');

      expect(service.minimizedWindows()).toHaveLength(1);
      expect(service.minimizedWindows()[0].id).toBe('window-2');
    });

    it('should handle restoring non-existent window gracefully', () => {
      service.minimizeWindow('window-1', 'console');
      service.restoreWindow('non-existent');

      expect(service.minimizedWindows()).toHaveLength(1);
    });
  });

  describe('isMinimized', () => {
    it('should return true for minimized window', () => {
      service.minimizeWindow('window-1', 'console');

      expect(service.isMinimized('window-1')).toBe(true);
    });

    it('should return false for non-minimized window', () => {
      expect(service.isMinimized('window-1')).toBe(false);
    });

    it('should return false after window is restored', () => {
      service.minimizeWindow('window-1', 'console');
      service.restoreWindow('window-1');

      expect(service.isMinimized('window-1')).toBe(false);
    });
  });

  describe('toggleMinimize', () => {
    it('should minimize window if not minimized', () => {
      service.toggleMinimize('window-1', 'console');

      expect(service.isMinimized('window-1')).toBe(true);
    });

    it('should restore window if already minimized', () => {
      service.minimizeWindow('window-1', 'console');
      service.toggleMinimize('window-1', 'console');

      expect(service.isMinimized('window-1')).toBe(false);
    });

    it('should preserve linkId when toggling', () => {
      service.toggleMinimize('wireshark-1', 'wireshark', 'link-123');
      expect(service.minimizedWindows()[0].linkId).toBe('link-123');

      service.toggleMinimize('wireshark-1', 'wireshark', 'link-123');
      expect(service.isMinimized('wireshark-1')).toBe(false);
    });
  });

  describe('getMinimizedByType', () => {
    beforeEach(() => {
      service.minimizeWindow('console-1', 'console');
      service.minimizeWindow('wireshark-1', 'wireshark');
      service.minimizeWindow('wireshark-2', 'wireshark');
    });

    it('should return only console windows', () => {
      const consoles = service.getMinimizedByType('console');

      expect(consoles).toHaveLength(1);
      expect(consoles[0].type).toBe('console');
    });

    it('should return only wireshark windows', () => {
      const wiresharks = service.getMinimizedByType('wireshark');

      expect(wiresharks).toHaveLength(2);
      wiresharks.forEach(w => expect(w.type).toBe('wireshark'));
    });
  });

  describe('clearAll', () => {
    it('should remove all minimized windows', () => {
      service.minimizeWindow('window-1', 'console');
      service.minimizeWindow('window-2', 'wireshark');
      service.clearAll();

      expect(service.minimizedWindows()).toHaveLength(0);
    });

    it('should handle clearing when no windows are minimized', () => {
      expect(() => service.clearAll()).not.toThrow();
    });
  });
});
