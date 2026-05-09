import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ValidationService } from '../base/validation.service';
import { CloudValidationService } from './cloud-validation.service';

describe('CloudValidationService', () => {
  let service: CloudValidationService;
  let baseValidationService: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [ValidationService, CloudValidationService],
    });

    baseValidationService = TestBed.inject(ValidationService);
    service = TestBed.inject(CloudValidationService);
  });

  describe('validateName', () => {
    it('should pass validation for non-empty name', () => {
      const result = service.validateName('Cloud-1');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateName('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Name is required');
    });

    it('should fail validation for whitespace only', () => {
      const result = service.validateName('   ');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Name is required');
    });
  });

  describe('validateRemoteConsolePort', () => {
    it('should pass validation for valid port (1-65535)', () => {
      const result = service.validateRemoteConsolePort('3080');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for port 1 (minimum)', () => {
      const result = service.validateRemoteConsolePort('1');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for port 65535 (maximum)', () => {
      const result = service.validateRemoteConsolePort('65535');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for empty string (optional field)', () => {
      const result = service.validateRemoteConsolePort('');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for port 0 (below minimum)', () => {
      const result = service.validateRemoteConsolePort('0');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('between 1 and 65535');
    });

    it('should fail validation for port above 65535', () => {
      const result = service.validateRemoteConsolePort('65536');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('between 1 and 65535');
    });

    it('should fail validation for non-numeric input', () => {
      const result = service.validateRemoteConsolePort('abc');

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateInterfaceName', () => {
    it('should pass validation for valid interface name', () => {
      const result = service.validateInterfaceName('eth0');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for tap interface', () => {
      const result = service.validateInterfaceName('tap0');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateInterfaceName('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Interface name is required');
    });

    it('should fail validation for whitespace only', () => {
      const result = service.validateInterfaceName('   ');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Interface name is required');
    });
  });

  describe('validateUniqueInterface', () => {
    it('should pass validation for unique interface name', () => {
      const existingInterfaces = ['eth0', 'eth1', 'tap0'];
      const result = service.validateUniqueInterface('eth2', existingInterfaces);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for duplicate interface name', () => {
      const existingInterfaces = ['eth0', 'eth1', 'tap0'];
      const result = service.validateUniqueInterface('eth0', existingInterfaces);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('already configured');
    });

    it('should pass validation for empty existing interfaces', () => {
      const existingInterfaces: string[] = [];
      const result = service.validateUniqueInterface('eth0', existingInterfaces);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe('validateConsoleType', () => {
    const supportedTypes = ['telnet', 'vnc', 'spice', 'http', 'https', 'none'];

    it('should pass validation for valid console type', () => {
      const result = service.validateConsoleType('telnet', supportedTypes);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for "none" console type', () => {
      const result = service.validateConsoleType('none', supportedTypes);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for empty string', () => {
      const result = service.validateConsoleType('', supportedTypes);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('required');
    });

    it('should fail validation for invalid console type', () => {
      const result = service.validateConsoleType('invalid_type', supportedTypes);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid console type');
    });

    it('should fail validation for console type not in supported list', () => {
      const result = service.validateConsoleType('ssh', supportedTypes);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Must be one of');
    });
  });

  describe('validateRemoteConsoleHost', () => {
    it('should pass validation for valid hostname', () => {
      const result = service.validateRemoteConsoleHost('localhost');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for valid IP address', () => {
      const result = service.validateRemoteConsoleHost('192.168.1.1');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for empty string (optional field)', () => {
      const result = service.validateRemoteConsoleHost('');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for FQDN', () => {
      const result = service.validateRemoteConsoleHost('server.example.com');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for invalid characters', () => {
      const result = service.validateRemoteConsoleHost('invalid host@name');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid hostname or IP');
    });
  });

  describe('validateRemoteConsoleHttpPath', () => {
    it('should pass validation for valid path starting with /', () => {
      const result = service.validateRemoteConsoleHttpPath('/console');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for root path', () => {
      const result = service.validateRemoteConsoleHttpPath('/');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for empty string (optional field)', () => {
      const result = service.validateRemoteConsoleHttpPath('');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for path not starting with /', () => {
      const result = service.validateRemoteConsoleHttpPath('console');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('must start with /');
    });

    it('should fail validation for relative path', () => {
      const result = service.validateRemoteConsoleHttpPath('./path');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('must start with /');
    });
  });
});
