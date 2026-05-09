import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ValidationService } from '../base/validation.service';
import { AtmSwitchValidationService } from './atm-switch-validation.service';

describe('AtmSwitchValidationService', () => {
  let service: AtmSwitchValidationService;
  let baseValidationService: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [ValidationService, AtmSwitchValidationService],
    });

    baseValidationService = TestBed.inject(ValidationService);
    service = TestBed.inject(AtmSwitchValidationService);
  });

  describe('validateSourcePort', () => {
    it('should pass validation for valid port number', () => {
      const result = service.validateSourcePort('0');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for positive port number', () => {
      const result = service.validateSourcePort('42');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateSourcePort('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source Port is required');
    });

    it('should fail validation for whitespace only', () => {
      const result = service.validateSourcePort('   ');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source Port is required');
    });

    it('should fail validation for negative number', () => {
      const result = service.validateSourcePort('-1');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source Port must be a non-negative integer');
    });

    it('should fail validation for decimal number', () => {
      const result = service.validateSourcePort('1.5');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source Port must be a non-negative integer');
    });

    it('should fail validation for non-numeric input', () => {
      const result = service.validateSourcePort('abc');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source Port must be a non-negative integer');
    });
  });

  describe('validateDestinationPort', () => {
    it('should pass validation for valid port number', () => {
      const result = service.validateDestinationPort('10');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateDestinationPort('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Destination Port is required');
    });

    it('should fail validation for negative number', () => {
      const result = service.validateDestinationPort('-5');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Destination Port must be a non-negative integer');
    });
  });

  describe('validateSourceVci', () => {
    it('should pass validation for valid VCI (>= 1)', () => {
      const result = service.validateSourceVci('1');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for larger VCI', () => {
      const result = service.validateSourceVci('100');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateSourceVci('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VCI is required');
    });

    it('should fail validation for zero', () => {
      const result = service.validateSourceVci('0');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VCI must be a positive (>= 1) integer');
    });

    it('should fail validation for negative number', () => {
      const result = service.validateSourceVci('-1');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VCI must be a positive (>= 1) integer');
    });

    it('should fail validation for decimal number', () => {
      const result = service.validateSourceVci('1.5');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VCI must be a positive (>= 1) integer');
    });
  });

  describe('validateDestinationVci', () => {
    it('should pass validation for valid VCI', () => {
      const result = service.validateDestinationVci('50');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateDestinationVci('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Destination VCI is required');
    });
  });

  describe('validateSourceVpi', () => {
    it('should pass validation for valid VPI (>= 1)', () => {
      const result = service.validateSourceVpi('5');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateSourceVpi('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VPI is required');
    });

    it('should fail validation for zero', () => {
      const result = service.validateSourceVpi('0');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VPI must be a positive (>= 1) integer');
    });
  });

  describe('validateDestinationVpi', () => {
    it('should pass validation for valid VPI', () => {
      const result = service.validateDestinationVpi('10');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateDestinationVpi('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Destination VPI is required');
    });
  });

  describe('validateMappingEntry', () => {
    it('should pass validation for all valid VC mapping inputs', () => {
      const result = service.validateMappingEntry(
        '0',   // sourcePort
        '1',   // sourceVci
        '1',   // destinationPort
        '2',   // destinationVci
        '5',   // sourceVpi
        '10',  // destinationVpi
        false  // useVpiOnly (VC mode)
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for all valid VP mapping inputs', () => {
      const result = service.validateMappingEntry(
        '0',   // sourcePort
        '32',  // sourceVci
        '1',   // destinationPort
        '33',  // destinationVci
        '',    // sourceVpi (not used in VP mode)
        '',    // destinationVpi (not used in VP mode)
        true   // useVpiOnly (VP mode)
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation when source port is empty', () => {
      const result = service.validateMappingEntry(
        '',    // sourcePort (empty)
        '1',   // sourceVci
        '1',   // destinationPort
        '2',   // destinationVci
        '5',   // sourceVpi
        '10',  // destinationVpi
        false
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source Port is required');
    });

    it('should fail validation when source VCI is invalid', () => {
      const result = service.validateMappingEntry(
        '0',
        '0',   // sourceVci (must be >= 1)
        '1',
        '2',
        '5',
        '10',
        false
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VCI must be a positive (>= 1) integer');
    });

    it('should fail validation when destination port is invalid', () => {
      const result = service.validateMappingEntry(
        '0',
        '1',
        '-1',  // destinationPort (negative)
        '2',
        '5',
        '10',
        false
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Destination Port must be a non-negative integer');
    });

    it('should fail validation when source VPI is invalid in VC mode', () => {
      const result = service.validateMappingEntry(
        '0',
        '1',
        '1',
        '2',
        '0',   // sourceVpi (must be >= 1)
        '10',
        false  // VC mode
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Source VPI must be a positive (>= 1) integer');
    });

    it('should skip VPI validation in VP mode', () => {
      const result = service.validateMappingEntry(
        '0',
        '32',
        '1',
        '33',
        '',    // sourceVpi (empty, but OK in VP mode)
        '',    // destinationVpi (empty, but OK in VP mode)
        true   // VP mode
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUniqueMapping', () => {
    it('should pass validation for unique mapping', () => {
      const existingMappings = [
        { portIn: '0:0:1', portOut: '1:0:2' },
        { portIn: '0:0:3', portOut: '1:0:4' },
      ];

      const result = service.validateUniqueMapping('0:5:1', existingMappings);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for duplicate mapping', () => {
      const existingMappings = [
        { portIn: '0:0:1', portOut: '1:0:2' },
        { portIn: '0:0:3', portOut: '1:0:4' },
      ];

      const result = service.validateUniqueMapping('0:0:1', existingMappings);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('This mapping already exists');
    });
  });

  describe('validateVcMapping', () => {
    it('should pass validation for valid VC mapping format', () => {
      const result = service.validateVcMapping('0:5:100');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for invalid VC mapping format', () => {
      const result = service.validateVcMapping('invalid-format');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('VC mapping must be in format: port:vpi:vci (e.g., 0:0:100)');
    });

    it('should fail validation for empty string', () => {
      const result = service.validateVcMapping('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Mapping is required');
    });
  });

  describe('validateVpMapping', () => {
    it('should pass validation for valid VP mapping format', () => {
      const result = service.validateVpMapping('0:32');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for invalid VP mapping format', () => {
      const result = service.validateVpMapping('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('VP mapping must be in format: port:vpi (e.g., 0:0)');
    });

    it('should fail validation for VC format (too many parts)', () => {
      const result = service.validateVpMapping('0:5:100');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('VP mapping must be in format: port:vpi (e.g., 0:0)');
    });
  });
});
