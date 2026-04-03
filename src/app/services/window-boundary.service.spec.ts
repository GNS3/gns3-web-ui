import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { WindowBoundaryService, WindowStyle, BoundaryConfig } from './window-boundary.service';

describe('WindowBoundaryService', () => {
  const VIEWPORT_WIDTH = 1920;
  const VIEWPORT_HEIGHT = 1080;

  let service: WindowBoundaryService;

  beforeEach(() => {
    service = new WindowBoundaryService();

    // Mock window dimensions (viewport: 1920x1080)
    vi.stubGlobal('window', {
      innerWidth: VIEWPORT_WIDTH,
      innerHeight: VIEWPORT_HEIGHT,
    });
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of WindowBoundaryService', () => {
      expect(service).toBeInstanceOf(WindowBoundaryService);
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

    it('should have default config with undefined maxWidth', () => {
      const config = service.getConfigValue();
      expect(config.maxWidth).toBeUndefined();
    });

    it('should have default config with undefined maxHeight', () => {
      const config = service.getConfigValue();
      expect(config.maxHeight).toBeUndefined();
    });

    it('should have default config with undefined topOffset', () => {
      const config = service.getConfigValue();
      expect(config.topOffset).toBeUndefined();
    });
  });

  describe('getConfig', () => {
    it('should return an Observable', () => {
      const config$ = service.getConfig();
      expect(config$).toBeDefined();
    });

    it('should emit current configuration', async () => {
      const config = await firstValueFrom(service.getConfig());

      expect(config).toBeDefined();
      expect(config.minWidth).toBe(500);
    });

    it('should emit updated configuration after setConfig', async () => {
      service.setConfig({ minWidth: 700 });
      const config = await firstValueFrom(service.getConfig());

      expect(config.minWidth).toBe(700);
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
      // Collect both emissions (initial + after setConfig)
      const emissionsPromise = firstValueFrom(service.getConfig().pipe(take(2), toArray()));

      service.setConfig({ minWidth: 700 });

      const emissions = await emissionsPromise;

      expect(emissions.length).toBe(2);
      expect(emissions[0].minWidth).toBe(500); // Default initial value
      expect(emissions[1].minWidth).toBe(700); // Updated value
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

    it('should reset maxWidth and maxHeight to undefined', () => {
      service.setConfig({ maxWidth: 1000, maxHeight: 800 });
      service.resetConfig();

      const config = service.getConfigValue();
      expect(config.maxWidth).toBeUndefined();
      expect(config.maxHeight).toBeUndefined();
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
      // viewport=1920, width=500, maxLeft=1420
      const style: WindowStyle = { left: '0px', top: '0px', width: '500px', height: '400px' };
      const result = service.constrainDragPosition(style, 2000, 0);

      expect(result.left).toBe('1420px'); // viewport - width = 1920 - 500
    });

    it('should constrain top position within viewport', () => {
      // viewport=1080, height=400, maxTop=680
      const style: WindowStyle = { left: '0px', top: '0px', width: '500px', height: '400px' };
      const result = service.constrainDragPosition(style, 0, 2000);

      expect(result.top).toBe('680px'); // viewport - height = 1080 - 400
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
      const result = service.constrainDragPosition(style, 0, -200);

      // minTop is topOffset when configured
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
      // viewport=1920, left=500, maxWidth=1420
      const result = service.constrainResizeSize(2000, 500, 500, 0);

      expect(result.width).toBe(1420); // viewport - left
    });

    it('should respect top offset when constraining height', () => {
      // viewport=1080, top=300, maxHeight=780
      const result = service.constrainResizeSize(500, 2000, 0, 300);

      expect(result.height).toBe(780); // viewport - top
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

    it('should prioritize minimum over viewport constraint', () => {
      // minWidth=500, viewport=1920, left=0, so viewport constraint allows 1920
      const result = service.constrainResizeSize(100, 400, 0, 0);

      expect(result.width).toBe(500); // minWidth takes precedence
      expect(result.height).toBe(400); // minHeight
    });

    it('should prioritize maxWidth over viewport constraint', () => {
      service.setConfig({ maxWidth: 600 });
      // viewport=1920, left=0, maxWidth=600
      const result = service.constrainResizeSize(2000, 500, 0, 0);

      expect(result.width).toBe(600); // maxWidth takes precedence
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
      // viewport=1920, width=500, maxLeft=1420
      const style: WindowStyle = { left: '2000px', top: '100px', width: '500px', height: '400px' };
      const result = service.constrainWindowPosition(style);

      expect(result.left).toBe('1420px'); // viewport - width
    });

    it('should constrain right within viewport bounds', () => {
      // viewport=1920, width=500, maxRight=1420
      const style: WindowStyle = { right: '2000px', top: '100px', width: '500px', height: '400px' };
      const result = service.constrainWindowPosition(style);

      expect(result.right).toBe('1420px'); // Math.max(0, Math.min(1420, 2000))
    });

    it('should constrain top within viewport bounds', () => {
      // viewport=1080, height=400, maxTop=680
      const style: WindowStyle = { left: '100px', top: '2000px', width: '500px', height: '400px' };
      const result = service.constrainWindowPosition(style);

      expect(result.top).toBe('680px'); // viewport - height
    });

    it('should constrain bottom within viewport bounds', () => {
      // viewport=1080, height=400, maxBottom=680
      const style: WindowStyle = { left: '100px', bottom: '2000px', width: '500px', height: '400px' };
      const result = service.constrainWindowPosition(style);

      expect(result.bottom).toBe('680px'); // Math.max(0, Math.min(680, 2000))
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

    it.each([
      { description: 'left takes precedence when listed first', style: { left: '100px', right: '100px', top: '100px', width: '500px', height: '400px' }, expectedLeft: undefined, expectedRight: '100px' },
      { description: 'left takes precedence when listed second', style: { right: '100px', left: '100px', top: '100px', width: '500px', height: '400px' }, expectedLeft: undefined, expectedRight: '100px' },
    ])('should delete conflicting position properties: $description', ({ style, expectedLeft, expectedRight }) => {
      const result = service.constrainWindowPosition(style);

      expect(result.left).toBe(expectedLeft);
      expect(result.right).toBe(expectedRight);
    });

    it('should handle style without position properties', () => {
      const style: WindowStyle = { width: '500px', height: '400px' };
      const result = service.constrainWindowPosition(style);

      expect(result.width).toBe('500px');
      expect(result.height).toBe('400px');
    });

    it('should delete bottom when top is processed', () => {
      const style: WindowStyle = { top: '100px', bottom: '100px', width: '500px', height: '400px' };
      const result = service.constrainWindowPosition(style);

      expect(result.top).toBe('100px');
      expect(result.bottom).toBeUndefined();
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

    it('should return true for width at exact maximum', () => {
      service.setConfig({ maxWidth: 1000 });

      const result = service.isValidSize(1000, 500);
      expect(result).toBe(true);
    });

    it('should return true for height at exact maximum', () => {
      service.setConfig({ maxHeight: 600 });

      const result = service.isValidSize(500, 600);
      expect(result).toBe(true);
    });

    it('should accept string width', () => {
      const result = service.isValidSize('600', 500);
      expect(result).toBe(true);
    });

    it('should accept string height', () => {
      const result = service.isValidSize(600, '500');
      expect(result).toBe(true);
    });

    it.each([
      ['non-numeric string', 'abc', 500],
      ['undefined width', undefined, 500],
      ['null width', null, 500],
      ['object width', { value: 600 } as any, 500],
    ])('should return false for invalid width: %s', (_, width, height) => {
      expect(service.isValidSize(width, height)).toBe(false);
    });

    it.each([
      ['non-numeric string', 600, 'abc'],
      ['undefined height', 600, undefined],
      ['null height', 600, null],
      ['object height', 600, { value: 500 } as any],
    ])('should return false for invalid height: %s', (_, width, height) => {
      expect(service.isValidSize(width, height)).toBe(false);
    });

    it('should return true for exact minimum values', () => {
      const result = service.isValidSize(500, 400);
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle window with 0 innerWidth', () => {
      vi.stubGlobal('window', { innerWidth: 0, innerHeight: VIEWPORT_HEIGHT });

      const style: WindowStyle = { left: '100px', top: '100px', width: '500px', height: '400px' };

      expect(() => service.constrainWindowPosition(style)).not.toThrow();
    });

    it('should handle window with 0 innerHeight', () => {
      vi.stubGlobal('window', { innerWidth: VIEWPORT_WIDTH, innerHeight: 0 });

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
