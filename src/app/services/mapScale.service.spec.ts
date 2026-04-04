import { describe, it, expect, beforeEach, vi } from 'vitest';
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

    it('should emit scale change event', () => {
      const emitSpy = vi.spyOn(service.scaleChangeEmitter, 'emit');
      service.setScale(3);
      expect(emitSpy).toHaveBeenCalledWith(3);
    });

    it.each([
      [0.5, 0.5],
      [10, 10],
      [0, 0],
      [0.1, 0.1],
      [0.01, 0.01],
    ])('should handle scale value %s', (input, expected) => {
      service.setScale(input);
      expect(service.currentScale).toBe(expected);
      expect(mockContext.transformation.k).toBe(expected);
    });

    it('should emit event for each scale change', () => {
      const emitSpy = vi.spyOn(service.scaleChangeEmitter, 'emit');
      service.setScale(1.5);
      service.setScale(2);
      service.setScale(2.5);
      expect(emitSpy).toHaveBeenCalledTimes(3);
      expect(emitSpy).toHaveBeenNthCalledWith(1, 1.5);
      expect(emitSpy).toHaveBeenNthCalledWith(2, 2);
      expect(emitSpy).toHaveBeenNthCalledWith(3, 2.5);
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

    it('should emit scale change event with default value', () => {
      const emitSpy = vi.spyOn(service.scaleChangeEmitter, 'emit');
      service.setScale(2);
      emitSpy.mockClear();
      service.resetToDefault();
      expect(emitSpy).toHaveBeenCalledWith(1);
    });

    it('should emit event even when already at default scale', () => {
      const emitSpy = vi.spyOn(service.scaleChangeEmitter, 'emit');
      service.resetToDefault();
      expect(emitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Scale Range', () => {
    it.each([
      [0.1, 'minimum realistic scale'],
      [5, 'maximum realistic scale'],
      [-1, 'negative scale (zoom out)'],
    ])('should handle %s', (scale, description) => {
      service.setScale(scale);
      expect(service.currentScale).toBe(scale);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid scale changes', () => {
      const emitSpy = vi.spyOn(service.scaleChangeEmitter, 'emit');
      for (let i = 1; i <= 10; i++) {
        service.setScale(i * 0.5);
      }
      expect(emitSpy).toHaveBeenCalledTimes(10);
    });

    it('should emit event for each setScale call', () => {
      const emitSpy = vi.spyOn(service.scaleChangeEmitter, 'emit');
      service.setScale(2);
      service.setScale(2);
      service.setScale(2);
      expect(emitSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle NaN input', () => {
      service.setScale(NaN);
      expect(service.currentScale).toBeNaN();
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
