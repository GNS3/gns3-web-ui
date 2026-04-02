import { describe, it, expect, beforeEach } from 'vitest';
import { RotationValidator } from './rotation-validator';

describe('RotationValidator', () => {
  let validator: RotationValidator;

  beforeEach(() => {
    validator = new RotationValidator();
  });

  describe('validate', () => {
    describe('valid values', () => {
      it('should return null when value is zero', () => {
        const control = { value: 0 };
        expect(validator.get(control)).toBeNull();
      });

      it('should return null when value is 360', () => {
        const control = { value: 360 };
        expect(validator.get(control)).toBeNull();
      });

      it('should return null when value is positive within range', () => {
        const control = { value: 180 };
        expect(validator.get(control)).toBeNull();
      });

      it('should return null when value is -359', () => {
        const control = { value: -359 };
        expect(validator.get(control)).toBeNull();
      });

      it('should return null when value is decimal within range', () => {
        const control = { value: 45.5 };
        expect(validator.get(control)).toBeNull();
      });

      it('should return null when value is negative decimal within range', () => {
        const control = { value: -180.5 };
        expect(validator.get(control)).toBeNull();
      });

      it('should return null when value is string number within range', () => {
        const control = { value: '90' };
        expect(validator.get(control)).toBeNull();
      });
    });

    describe('invalid values', () => {
      it('should return error when value is greater than 360', () => {
        const control = { value: 361 };
        expect(validator.get(control)).toEqual({ negativeValue: true });
      });

      it('should return error when value is less than -360', () => {
        const control = { value: -361 };
        expect(validator.get(control)).toEqual({ negativeValue: true });
      });

      it('should return error when value is much larger than 360', () => {
        const control = { value: 720 };
        expect(validator.get(control)).toEqual({ negativeValue: true });
      });

      it('should return error when value is much less than -360', () => {
        const control = { value: -720 };
        expect(validator.get(control)).toEqual({ negativeValue: true });
      });
    });

    describe('edge cases', () => {
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
});
