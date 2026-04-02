import { describe, it, expect, beforeEach } from 'vitest';
import { NonNegativeValidator } from './non-negative-validator';

describe('NonNegativeValidator', () => {
  let validator: NonNegativeValidator;

  beforeEach(() => {
    validator = new NonNegativeValidator();
  });

  describe('validate', () => {
    it('should return null when value is zero', () => {
      const control = { value: 0 };
      expect(validator.get(control)).toBeNull();
    });

    it('should return null when value is positive', () => {
      const control = { value: 42 };
      expect(validator.get(control)).toBeNull();
    });

    it('should return null when value is a positive decimal', () => {
      const control = { value: 3.14 };
      expect(validator.get(control)).toBeNull();
    });

    it('should return null when value is a positive string number', () => {
      const control = { value: '100' };
      expect(validator.get(control)).toBeNull();
    });

    it('should return error object when value is negative', () => {
      const control = { value: -1 };
      expect(validator.get(control)).toEqual({ negativeValue: true });
    });

    it('should return error object when value is negative decimal', () => {
      const control = { value: -3.14 };
      expect(validator.get(control)).toEqual({ negativeValue: true });
    });

    it('should return error object when value is a negative string number', () => {
      const control = { value: '-50' };
      expect(validator.get(control)).toEqual({ negativeValue: true });
    });

    it('should handle null value as zero', () => {
      const control = { value: null };
      expect(validator.get(control)).toBeNull();
    });

    it('should handle undefined value as invalid (NaN)', () => {
      const control = { value: undefined };
      expect(validator.get(control)).toEqual({ negativeValue: true });
    });

    it('should handle empty string as zero', () => {
      const control = { value: '' };
      expect(validator.get(control)).toBeNull();
    });

    it('should handle NaN as invalid', () => {
      const control = { value: NaN };
      expect(validator.get(control)).toEqual({ negativeValue: true });
    });
  });
});
