import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationService, ValidationResult } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ValidationService();
  });

  describe('required', () => {
    it('should pass validation for non-empty string', () => {
      const result = service.required('test', 'Field');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.required('', 'Field');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Field is required');
    });

    it('should fail validation for whitespace only', () => {
      const result = service.required('   ', 'Field');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Field is required');
    });

    it('should fail validation for null', () => {
      const result = service.required(null as any, 'Field');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Field is required');
    });

    it('should fail validation for undefined', () => {
      const result = service.required(undefined as any, 'Field');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Field is required');
    });
  });

  describe('validatePort', () => {
    it('should pass validation for valid port (zero)', () => {
      const result = service.validatePort('0');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for valid positive port', () => {
      const result = service.validatePort('8080');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validatePort('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port is required');
    });

    it('should fail validation for negative port', () => {
      const result = service.validatePort('-1');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port must be a non-negative integer');
    });

    it('should fail validation for decimal port', () => {
      const result = service.validatePort('80.5');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port must be a non-negative integer');
    });

    it('should fail validation for non-numeric input', () => {
      const result = service.validatePort('abc');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port must be a non-negative integer');
    });
  });

  describe('validatePortRange', () => {
    it('should pass validation for port within range', () => {
      const result = service.validatePortRange('8080', 0, 65535);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for minimum boundary', () => {
      const result = service.validatePortRange('0', 0, 65535);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for maximum boundary', () => {
      const result = service.validatePortRange('65535', 0, 65535);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for port below minimum', () => {
      const result = service.validatePortRange('0', 1, 65535);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port must be between 1 and 65535');
    });

    it('should fail validation for port above maximum', () => {
      const result = service.validatePortRange('65536', 0, 65535);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port must be between 0 and 65535');
    });
  });

  describe('validatePositiveInteger', () => {
    it('should pass validation for positive integer', () => {
      const result = service.validatePositiveInteger('1', 'Test');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for larger positive integer', () => {
      const result = service.validatePositiveInteger('1000', 'Test');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for zero', () => {
      const result = service.validatePositiveInteger('0', 'Test');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Test must be at least 1');
    });

    it('should fail validation for negative number', () => {
      const result = service.validatePositiveInteger('-1', 'Test');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Test must be at least 1');
    });

    it('should fail validation for decimal', () => {
      const result = service.validatePositiveInteger('1.5', 'Test');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Test must be at least 1');
    });
  });

  describe('validateNumberRange', () => {
    it('should pass validation for number within range', () => {
      const result = service.validateNumberRange('50', 0, 100, 'Value');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for minimum boundary', () => {
      const result = service.validateNumberRange('0', 0, 100, 'Value');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for maximum boundary', () => {
      const result = service.validateNumberRange('100', 0, 100, 'Value');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for number below minimum', () => {
      const result = service.validateNumberRange('-1', 0, 100, 'Value');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be between 0 and 100');
    });

    it('should fail validation for number above maximum', () => {
      const result = service.validateNumberRange('101', 0, 100, 'Value');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be between 0 and 100');
    });
  });

  describe('validateIpAddress', () => {
    it('should pass validation for valid IPv4 address', () => {
      const result = service.validateIpAddress('192.168.1.1');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for valid localhost', () => {
      const result = service.validateIpAddress('127.0.0.1');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for invalid format', () => {
      const result = service.validateIpAddress('256.256.256.256');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid IP address format');
    });

    it('should fail validation for empty string', () => {
      const result = service.validateIpAddress('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('IP address is required');
    });

    it('should fail validation for non-IP format', () => {
      const result = service.validateIpAddress('not-an-ip');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid IP address format');
    });
  });

  describe('validateMacAddress', () => {
    it('should pass validation for valid MAC with colons', () => {
      const result = service.validateMacAddress('00:11:22:33:44:55');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for MAC with dashes (backend requires colons)', () => {
      const result = service.validateMacAddress('00-11-22-33-44-55');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)');
    });

    it('should fail validation for invalid format', () => {
      const result = service.validateMacAddress('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)');
    });

    it('should pass validation for empty string (optional field)', () => {
      const result = service.validateMacAddress('');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe('validateUnique', () => {
    it('should pass validation for unique value', () => {
      const existingValues = ['value1', 'value2', 'value3'];
      const result = service.validateUnique('value4', existingValues);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for duplicate value', () => {
      const existingValues = ['value1', 'value2', 'value3'];
      const result = service.validateUnique('value2', existingValues);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('This entry already exists');
    });

    it('should pass validation for same value during edit', () => {
      const existingValues = ['value1', 'value2', 'value3'];
      const result = service.validateUnique('value2', existingValues, 'value2');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe('validateHostname', () => {
    it('should pass validation for valid hostname', () => {
      const result = service.validateHostname('localhost');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for valid FQDN', () => {
      const result = service.validateHostname('server.example.com');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateHostname('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Hostname is required');
    });

    it('should fail validation for invalid format', () => {
      const result = service.validateHostname('invalid host name with spaces');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid hostname format');
    });

    it('should fail validation for hostname exceeding max length', () => {
      const longHostname = 'a'.repeat(254);
      const result = service.validateHostname(longHostname);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid hostname format');
    });
  });

  describe('createIntegerValidator', () => {
    it('should create a validator function', () => {
      const validator = service.createIntegerValidator('Test Field', 0);

      expect(typeof validator).toBe('function');
    });

    it('should create validator that validates correctly', () => {
      const validator = service.createIntegerValidator('Port', 0);

      const validResult = validator('42');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator('-1');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorMessage).toBe('Port must be a non-negative integer');
    });

    it('should create validator with correct error message for empty value', () => {
      const validator = service.createIntegerValidator('Test', 1);

      const result = validator('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Test is required');
    });

    it('should create validator that checks minimum value', () => {
      const validator = service.createIntegerValidator('Count', 1);

      const result = validator('0');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Count must be a positive (>= 1) integer');
    });

    it('should create validator for zero minimum', () => {
      const validator = service.createIntegerValidator('Port', 0);

      const result = validator('-1');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port must be a non-negative integer');
    });
  });
});
