import { describe, it, expect, beforeEach } from 'vitest';
import { MapScaleService } from './mapScale.service';
import { Context } from '../cartography/models/context';

describe('MapScaleService', () => {
  let service: MapScaleService;
  let mockContext: Context;

  beforeEach(() => {
    mockContext = new Context();
    service = new MapScaleService(mockContext);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default scale', () => {
      expect(service.currentScale).toBe(1);
      expect(service.getScale()).toBe(1);
    });

    it('should initialize context transformation scale', () => {
      expect(mockContext.transformation.k).toBe(1);
    });

    it('should have scale change emitter', () => {
      expect(service.scaleChangeEmitter).toBeDefined();
    });
  });

  describe('getScale', () => {
    it('should return current scale', () => {
      expect(service.getScale()).toBe(1);
    });

    it('should return updated scale after setScale', () => {
      service.setScale(2);
      expect(service.getScale()).toBe(2);
    });
  });

  describe('setScale', () => {
    it('should set new scale value', () => {
      service.setScale(1.5);
      expect(service.currentScale).toBe(1.5);
    });

    it('should update context transformation', () => {
      service.setScale(2.5);
      expect(mockContext.transformation.k).toBe(2.5);
    });

    it('should emit scale change event', async () => {
      const resultPromise = new Promise<number>((resolve) => {
        service.scaleChangeEmitter.subscribe((value) => {
          resolve(value);
        });
      });

      service.setScale(3);

      const result = await resultPromise;
      expect(result).toBe(3);
    });

    it('should handle decimal scale values', () => {
      service.setScale(0.5);
      expect(service.currentScale).toBe(0.5);
      expect(mockContext.transformation.k).toBe(0.5);
    });

    it('should handle large scale values', () => {
      service.setScale(10);
      expect(service.currentScale).toBe(10);
      expect(mockContext.transformation.k).toBe(10);
    });

    it('should handle zero scale', () => {
      service.setScale(0);
      expect(service.currentScale).toBe(0);
      expect(mockContext.transformation.k).toBe(0);
    });

    it('should emit event for each scale change', async () => {
      const values: number[] = [];

      const resultPromise = new Promise<void>((resolve) => {
        service.scaleChangeEmitter.subscribe((value) => {
          values.push(value);
          if (values.length === 3) {
            resolve();
          }
        });
      });

      service.setScale(1.5);
      service.setScale(2);
      service.setScale(2.5);

      await resultPromise;
      expect(values).toEqual([1.5, 2, 2.5]);
    });
  });

  describe('resetToDefault', () => {
    it('should reset scale to 1', () => {
      service.setScale(2);
      service.resetToDefault();

      expect(service.currentScale).toBe(1);
      expect(service.getScale()).toBe(1);
    });

    it('should update context transformation to default', () => {
      service.setScale(3);
      service.resetToDefault();

      expect(mockContext.transformation.k).toBe(1);
    });

    it('should emit scale change event with default value', async () => {
      service.setScale(2);

      const resultPromise = new Promise<number>((resolve) => {
        service.scaleChangeEmitter.subscribe((value) => {
          resolve(value);
        });
      });

      service.resetToDefault();

      const result = await resultPromise;
      expect(result).toBe(1);
    });

    it('should work when already at default scale', async () => {
      const resultPromise = new Promise<number>((resolve) => {
        service.scaleChangeEmitter.subscribe((value) => {
          resolve(value);
        });
      });

      service.resetToDefault();

      const result = await resultPromise;
      expect(result).toBe(1);
    });
  });

  describe('Scale Range', () => {
    it('should handle minimum realistic scale', () => {
      service.setScale(0.1);
      expect(service.currentScale).toBe(0.1);
    });

    it('should handle maximum realistic scale', () => {
      service.setScale(5);
      expect(service.currentScale).toBe(5);
    });

    it('should handle negative scale (zoom out)', () => {
      service.setScale(-1);
      expect(service.currentScale).toBe(-1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small decimal values', () => {
      service.setScale(0.01);
      expect(service.currentScale).toBe(0.01);
    });

    it('should handle rapid scale changes', async () => {
      const values: number[] = [];

      service.scaleChangeEmitter.subscribe((value) => {
        values.push(value);
      });

      // Rapidly change scale 10 times
      for (let i = 1; i <= 10; i++) {
        service.setScale(i * 0.5);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(values.length).toBe(10);
      expect(values[values.length - 1]).toBe(5);
    });

    it('should handle setting same scale multiple times', async () => {
      let emitCount = 0;

      service.scaleChangeEmitter.subscribe(() => {
        emitCount++;
      });

      service.setScale(2);
      service.setScale(2);
      service.setScale(2);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitCount).toBe(3);
    });
  });

  describe('Context Integration', () => {
    it('should sync with context transformation on setScale', () => {
      mockContext.transformation.k = 5;

      service.setScale(3);

      expect(mockContext.transformation.k).toBe(3);
    });

    it('should sync with context transformation on reset', () => {
      mockContext.transformation.k = 4;

      service.resetToDefault();

      expect(mockContext.transformation.k).toBe(1);
    });

    it('should not affect other context transformation properties', () => {
      mockContext.transformation.x = 100;
      mockContext.transformation.y = 200;

      service.setScale(2);

      expect(mockContext.transformation.x).toBe(100);
      expect(mockContext.transformation.y).toBe(200);
      expect(mockContext.transformation.k).toBe(2);
    });
  });
});
