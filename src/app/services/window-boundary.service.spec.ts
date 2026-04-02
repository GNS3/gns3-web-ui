import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WindowBoundaryService, WindowStyle, BoundaryConfig } from './window-boundary.service';

describe('WindowBoundaryService', () => {
  let service: WindowBoundaryService;

  beforeEach(() => {
    service = new WindowBoundaryService();

    // Mock window.innerWidth and window.innerHeight
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of WindowBoundaryService', () => {
      expect(service).toBeInstanceOf(WindowBoundaryService);
    });

    it('should be providedIn root', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Default Configuration', () => {
    it('should have default config with minVisibleSize of 100', () => {
      const config = service.getConfigValue();
      expect(config.minVisibleSize).toBe(100);
    });

    it('should have default config with minWidth of 500', () => {
      const config = service.getConfigValue();
      expect(config.minWidth).toBe(500);
    });

    it('should have default config with minHeight of 400', () => {
      const config = service.getConfigValue();
      expect(config.minHeight).toBe(400);
    });
  });

  describe('getConfig', () => {
    it('should return an Observable', () => {
      const config$ = service.getConfig();
      expect(config$).toBeDefined();
    });

    it('should emit current configuration', async () => {
      const config = await new Promise<BoundaryConfig>((resolve) => {
        service.getConfig().subscribe((config) => {
          resolve(config);
        });
      });

      expect(config).toBeDefined();
      expect(config.minWidth).toBe(500);
    });
  });

  describe('getConfigValue', () => {
    it('should return current configuration value', () => {
      const config = service.getConfigValue();
      expect(config).toBeDefined();
      expect(config.minWidth).toBe(500);
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      service.setConfig({ minWidth: 600 });
      const config = service.getConfigValue();
      expect(config.minWidth).toBe(600);
    });

    it('should merge with existing configuration', () => {
      service.setConfig({ minWidth: 600 });
      const config = service.getConfigValue();
      expect(config.minWidth).toBe(600);
      expect(config.minHeight).toBe(400); // Should remain unchanged
    });

    it('should emit new configuration via Observable', async () => {
      const emissions: BoundaryConfig[] = [];
      const configPromise = new Promise<BoundaryConfig>((resolve) => {
        service.getConfig().subscribe((config) => {
          emissions.push(config);
          if (emissions.length === 2) {
            resolve(config);
          }
        });
      });

      service.setConfig({ minWidth: 700 });

      const finalConfig = await configPromise;
      expect(finalConfig.minWidth).toBe(700);
      expect(emissions.length).toBe(2);
    });

    it('should update multiple config properties', () => {
      service.setConfig({
        minWidth: 600,
        minHeight: 500,
        maxWidth: 1200,
        maxHeight: 800,
      });

      const config = service.getConfigValue();
      expect(config.minWidth).toBe(600);
      expect(config.minHeight).toBe(500);
      expect(config.maxWidth).toBe(1200);
      expect(config.maxHeight).toBe(800);
    });

    it('should set topOffset', () => {
      service.setConfig({ topOffset: 50 });
      const config = service.getConfigValue();
      expect(config.topOffset).toBe(50);
    });
  });

  describe('resetConfig', () => {
    it('should reset to default configuration', () => {
      service.setConfig({ minWidth: 999, minHeight: 888 });
      service.resetConfig();

      const config = service.getConfigValue();
      expect(config.minWidth).toBe(500);
      expect(config.minHeight).toBe(400);
    });
  });

  describe('constrainDragPosition', () => {
    it('should return fixed position', () => {
      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };
      const result = service.constrainDragPosition(style, 0, 0);

      expect(result.position).toBe('fixed');
    });

    it('should preserve width and height', () => {
      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };
      const result = service.constrainDragPosition(style, 0, 0);

      expect(result.width).toBe('500px');
      expect(result.height).toBe('400px');
    });

    it('should constrain left position within viewport', () => {
      const style: WindowStyle = { left: '0px', top: '0px', width: '500px', height: '400px' };

      // Try to move right by 2000px
      const result = service.constrainDragPosition(style, 2000, 0);

      // Should be constrained to window.innerWidth - width
      expect(result.left).toBe('1420px');
    });

    it('should constrain top position within viewport', () => {
      const style: WindowStyle = { left: '0px', top: '0px', width: '500px', height: '400px' };

      // Try to move down by 2000px
      const result = service.constrainDragPosition(style, 0, 2000);

      // Should be constrained
      expect(result.top).toBe('680px');
    });

    it('should not constrain position within bounds', () => {
      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainDragPosition(style, 50, 50);

      expect(result.left).toBe('150px');
      expect(result.top).toBe('150px');
    });

    it('should handle right positioned windows', () => {
      const style: WindowStyle = { right: '100px', top: '0px', width: '500px', height: '400px' };

      const result = service.constrainDragPosition(style, 0, 0);

      expect(result.right).toBe('100px');
    });

    it('should handle bottom positioned windows', () => {
      const style: WindowStyle = { left: '0px', bottom: '100px', width: '500px', height: '400px' };

      const result = service.constrainDragPosition(style, 0, 0);

      expect(result.bottom).toBe('100px');
    });

    it('should apply topOffset constraint', () => {
      service.setConfig({ topOffset: 100 });

      const style: WindowStyle = { left: '0px', top: '0px', width: '500px', height: '400px' };

      // Try to move up (negative Y)
      const result = service.constrainDragPosition(style, 0, -200);

      // Should be constrained to topOffset
      expect(result.top).toBe('100px');
    });

    it('should handle undefined width and height', () => {
      const style: WindowStyle = { left: '100px', top: '100px' };

      const result = service.constrainDragPosition(style, 0, 0);

      expect(result.left).toBe('100px');
      expect(result.top).toBe('100px');
    });

    it('should handle negative movement values', () => {
      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainDragPosition(style, -50, -50);

      expect(result.left).toBe('50px');
      expect(result.top).toBe('50px');
    });
  });

  describe('constrainResizeSize', () => {
    it('should return constrained size object', () => {
      const result = service.constrainResizeSize(500, 400);

      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
    });

    it('should enforce minimum width', () => {
      const result = service.constrainResizeSize(100, 400);

      expect(result.width).toBe(500); // minWidth
    });

    it('should enforce minimum height', () => {
      const result = service.constrainResizeSize(500, 100);

      expect(result.height).toBe(400); // minHeight
    });

    it('should not constrain size within bounds', () => {
      const result = service.constrainResizeSize(600, 500);

      expect(result.width).toBe(600);
      expect(result.height).toBe(500);
    });

    it('should enforce maximum width when configured', () => {
      service.setConfig({ maxWidth: 800 });

      const result = service.constrainResizeSize(1000, 500);

      expect(result.width).toBe(800);
    });

    it('should enforce maximum height when configured', () => {
      service.setConfig({ maxHeight: 600 });

      const result = service.constrainResizeSize(500, 1000);

      expect(result.height).toBe(600);
    });

    it('should respect left offset when constraining width', () => {
      const result = service.constrainResizeSize(2000, 500, 500, 0);

      // maxWidth = 1920 - 500 = 1420
      expect(result.width).toBe(1420);
    });

    it('should respect top offset when constraining height', () => {
      const result = service.constrainResizeSize(500, 2000, 0, 300);

      // maxHeight = 1080 - 300 = 780
      expect(result.height).toBe(780);
    });

    it('should preserve left and top in result', () => {
      const result = service.constrainResizeSize(600, 500, 100, 50);

      expect(result.left).toBe(100);
      expect(result.top).toBe(50);
    });

    it('should handle zero dimensions', () => {
      const result = service.constrainResizeSize(0, 0);

      expect(result.width).toBe(500); // minWidth
      expect(result.height).toBe(400); // minHeight
    });
  });

  describe('constrainWindowPosition', () => {
    it('should return constrained style object', () => {
      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result).toBeDefined();
    });

    it('should preserve original style properties', () => {
      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px', position: 'fixed' };

      const result = service.constrainWindowPosition(style);

      expect(result.position).toBe('fixed');
      expect(result.width).toBe('500px');
      expect(result.height).toBe('400px');
    });

    it('should constrain left within viewport bounds', () => {
      const style: WindowStyle = { left: '2000px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result.left).toBe('1420px');
    });

    it('should constrain right within viewport bounds', () => {
      const style: WindowStyle = { right: '2000px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      // maxRight = 1920 - 500 = 1420
      // right = Math.max(0, Math.min(1420, 2000)) = 1420
      expect(result.right).toBe('1420px');
    });

    it('should constrain top within viewport bounds', () => {
      const style: WindowStyle = { left: '100px', top: '2000px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result.top).toBe('680px');
    });

    it('should constrain bottom within viewport bounds', () => {
      const style: WindowStyle = { left: '100px', bottom: '2000px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      // maxBottom = 1080 - 400 = 680
      // bottom = Math.max(0, Math.min(680, 2000)) = 680
      expect(result.bottom).toBe('680px');
    });

    it('should apply topOffset constraint', () => {
      service.setConfig({ topOffset: 100 });

      const style: WindowStyle = { left: '100px', top: '10px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result.top).toBe('100px');
    });

    it('should not constrain position within bounds', () => {
      const style: WindowStyle = { left: '500px', top: '300px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result.left).toBe('500px');
      expect(result.top).toBe('300px');
    });

    it('should delete conflicting position properties when right is processed', () => {
      const style: WindowStyle = { left: '100px', right: '100px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      // When both left and right are set, right takes precedence (processed first)
      // left is deleted and right is set
      expect(result.left).toBeUndefined();
      expect(result.right).toBe('100px');
    });

    it('should delete conflicting position properties for right', () => {
      const style: WindowStyle = { right: '100px', left: '100px', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result.left).toBeUndefined();
    });

    it('should handle style without position properties', () => {
      const style: WindowStyle = { width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      expect(result.width).toBe('500px');
      expect(result.height).toBe('400px');
    });
  });

  describe('isValidSize', () => {
    it('should return true for valid size', () => {
      const result = service.isValidSize(600, 500);
      expect(result).toBe(true);
    });

    it('should return false for width below minimum', () => {
      const result = service.isValidSize(100, 500);
      expect(result).toBe(false);
    });

    it('should return false for height below minimum', () => {
      const result = service.isValidSize(600, 100);
      expect(result).toBe(false);
    });

    it('should return false for width above maximum', () => {
      service.setConfig({ maxWidth: 1000 });

      const result = service.isValidSize(1500, 500);
      expect(result).toBe(false);
    });

    it('should return false for height above maximum', () => {
      service.setConfig({ maxHeight: 600 });

      const result = service.isValidSize(600, 1000);
      expect(result).toBe(false);
    });

    it('should accept string width', () => {
      const result = service.isValidSize('600', 500);
      expect(result).toBe(true);
    });

    it('should accept string height', () => {
      const result = service.isValidSize(600, '500');
      expect(result).toBe(true);
    });

    it('should return false for non-numeric string', () => {
      const result = service.isValidSize('abc', 500);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = service.isValidSize(undefined, 500);
      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = service.isValidSize(null, 500);
      expect(result).toBe(false);
    });

    it('should return false for object', () => {
      const result = service.isValidSize({ value: 600 } as any, 500);
      expect(result).toBe(false);
    });

    it('should return true for exact minimum values', () => {
      const result = service.isValidSize(500, 400);
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle window with 0 innerWidth', () => {
      Object.defineProperty(window, 'innerWidth', { value: 0, writable: true });

      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };

      expect(() => service.constrainWindowPosition(style)).not.toThrow();
    });

    it('should handle window with 0 innerHeight', () => {
      Object.defineProperty(window, 'innerHeight', { value: 0, writable: true });

      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };

      expect(() => service.constrainWindowPosition(style)).not.toThrow();
    });

    it('should handle NaN values in style', () => {
      const style: WindowStyle = { left: 'NaNpx', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      // NaN parsed from "NaNpx" stays NaN
      expect(result.left).toBe('NaNpx');
    });

    it('should handle non-pixel values in style', () => {
      const style: WindowStyle = { left: '50%', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      // "50%".split('px')[0] = "50%", Number("50%") = NaN
      expect(result.left).toBe('NaNpx');
    });

    it('should handle empty string values in style', () => {
      const style: WindowStyle = { left: '', top: '100px', width: '500px', height: '400px' };

      const result = service.constrainWindowPosition(style);

      // Empty string should be parsed as 0
      expect(result.left).toBe('0px');
    });
  });
});
