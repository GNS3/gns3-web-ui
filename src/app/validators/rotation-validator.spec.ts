import { describe, it, expect, beforeEach } from 'vitest';
import { RotationValidator } from './rotation-validator';

/**
 * Mock AbstractControl interface for testing
 * The validator only uses the `value` property, so a minimal mock suffices
 */
interface MockControl {
  value: unknown;
}

describe('RotationValidator', () => {
  let validator: RotationValidator;

  beforeEach(() => {
    validator = new RotationValidator();
  });

  describe('get', () => {
    describe('should return null for valid rotation values (-360 < value <= 360)', () => {
      // Parameterized test for all valid rotation cases
      it.each([
        [0, 'zero (origin)'],
        [360, '360 (upper boundary, inclusive)'],
        [180, 'positive within range'],
        [-359, 'negative within range (just above -360)'],
        [45.5, 'positive decimal'],
        [-180.5, 'negative decimal'],
        ['90', 'positive string number'],
        ['-90', 'negative string number'],
        ['0', 'zero as string'],
        ['180.5', 'decimal string number'],
        [0.001, 'smallest positive decimal'],
        [-0.001, 'smallest negative decimal'],
      ])('when value is %s (%s)', (value: unknown, _description: string) => {
        // Arrange
        const control: MockControl = { value };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toBeNull();
      });

      // Edge case: coercible falsy values that become 0
      it.each([
        [null, 'null coerced to 0'],
        ['', 'empty string coerced to 0'],
        ['  ', 'whitespace string coerced to 0'],
        [false, 'false coerced to 0'],
        [[], 'empty array coerced to 0 (via toString -> "")'],
      ])('when value is %s (%s)', (value: unknown, _description: string) => {
        // Arrange
        const control: MockControl = { value };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('should return error object for invalid rotation values (value <= -360 or value > 360)', () => {
      // Parameterized test for all invalid cases
      it.each([
        [361, 'just above 360 (upper boundary)'],
        [360.001, '360.001 (just above 360)'],
        [-360, 'exactly -360 (lower boundary, exclusive)'],
        [-361, 'just below -360'],
        [-360.001, '-360.001 (just below -360)'],
        [720, 'far above 360 (two full rotations)'],
        [-720, 'far below -360'],
        [1080, 'three full rotations'],
        [-1080, 'negative three full rotations'],
      ])('when value is %s (%s)', (value: unknown, _description: string) => {
        // Arrange
        const control: MockControl = { value };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toEqual({ negativeValue: true });
      });

      // Edge case: infinite values
      it.each([
        [Infinity, 'positive infinity (exceeds all bounds)'],
        [-Infinity, 'negative infinity (below all bounds)'],
      ])('when value is %s (%s)', (value: unknown, _description: string) => {
        // Arrange
        const control: MockControl = { value };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toEqual({ negativeValue: true });
      });

      // Edge case: non-coercible values become NaN
      it.each([
        [undefined, 'undefined becomes NaN'],
        [NaN, 'explicit NaN value'],
        ['not-a-number', 'non-numeric string becomes NaN'],
        [{}, 'object becomes NaN'],
      ])('when value is %s (%s)', (value: unknown, _description: string) => {
        // Arrange
        const control: MockControl = { value };

        // Act
        const result = validator.get(control);

        // Assert
        // NaN comparison is always false, so it falls outside the valid range
        expect(result).toEqual({ negativeValue: true });
      });
    });

    describe('boundary behavior', () => {
      it('should treat -360 as invalid (exclusive lower bound)', () => {
        // Arrange
        const control: MockControl = { value: -360 };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toEqual({ negativeValue: true });
      });

      it('should treat 360 as valid (inclusive upper bound)', () => {
        // Arrange
        const control: MockControl = { value: 360 };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle -360.001 as invalid', () => {
        // Arrange
        const control: MockControl = { value: -360.001 };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toEqual({ negativeValue: true });
      });

      it('should handle 360.001 as invalid', () => {
        // Arrange
        const control: MockControl = { value: 360.001 };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toEqual({ negativeValue: true });
      });
    });
  });
});
