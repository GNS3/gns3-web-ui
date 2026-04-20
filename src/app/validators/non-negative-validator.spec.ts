import { describe, it, expect, beforeEach } from 'vitest';
import { NonNegativeValidator } from './non-negative-validator';

/**
 * Mock AbstractControl interface for testing
 * The validator only uses the `value` property, so a minimal mock suffices
 */
interface MockControl {
  value: unknown;
}

describe('NonNegativeValidator', () => {
  let validator: NonNegativeValidator;

  beforeEach(() => {
    validator = new NonNegativeValidator();
  });

  describe('get', () => {
    describe('should return null for valid (non-negative) values', () => {
      // Parameterized test for all non-negative cases
      it.each([
        [0, 'zero (boundary value)'],
        [42, 'positive integer'],
        [3.14, 'positive decimal'],
        ['100', 'positive string number'],
        [Infinity, 'positive infinity'],
        ['0', 'zero as string'],
        ['3.14', 'positive decimal string'],
      ])('when value is %s (%s)', (value: unknown, _description: string) => {
        // Arrange
        const control: MockControl = { value };

        // Act
        const result = validator.get(control);

        // Assert
        expect(result).toBeNull();
      });

      // Edge case: coercible falsy values
      it.each([
        [null, 'null coerced to 0'],
        ['', 'empty string coerced to 0'],
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

    describe('should return error object for invalid (negative) values', () => {
      // Parameterized test for all negative cases
      it.each([
        [-1, 'negative integer'],
        [-3.14, 'negative decimal'],
        ['-50', 'negative string number'],
        [-Infinity, 'negative infinity'],
        ['-0.001', 'negative decimal near zero'],
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
        // NaN >= 0 is false, so it's treated as negative
        expect(result).toEqual({ negativeValue: true });
      });
    });
  });
});
