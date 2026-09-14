import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ValidationService } from '../base/validation.service';
import { QemuValidationService } from './qemu-validation.service';

describe('QemuValidationService', () => {
  let service: QemuValidationService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [ValidationService, QemuValidationService],
    });

    service = TestBed.inject(QemuValidationService);
  });

  describe('validatePortNameFormat', () => {
    it('should pass validation when empty', () => {
      expect(service.validatePortNameFormat('')).toEqual({ isValid: true });
      expect(service.validatePortNameFormat('   ')).toEqual({ isValid: true });
    });

    it.each([
      'Ethernet{0}',
      '{0}',
      'eth{0}',
      'Gi0/0/0/{0}',
      'Network Adapter {0}',
      '{1}',
      'Gi{1}/{0}',
      '{adapter}',
      'Ethernet{adapter}',
      '{port0}',
      'ens{port4}',
      'sfp-sfpplus{port8}',
      'Ethernet{port1}',
      '{segment0}',
      'Ethernet{segment0}/{port0}',
      'ge-0/0/{0}',
      'Ethernet1/0/{port1}',
    ])('should accept server-supported format %s', (format) => {
      expect(service.validatePortNameFormat(format)).toEqual({ isValid: true });
    });

    it('should accept multiple placeholders in one format', () => {
      expect(service.validatePortNameFormat('Gi{segment0}/{port0}+{0}')).toEqual({ isValid: true });
    });

    it('should reject a format without any placeholder', () => {
      const result = service.validatePortNameFormat('Ethernet');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Port name format must include at least one placeholder (e.g., Ethernet{0})');
    });

    it.each([
      '{port9}',
      '{segment9}',
      '{2}',
      '{ethernet}',
      '{ 0 }',
      'Ethernet{0:02d}',
      '{0{1}}',
    ])('should reject unsupported placeholder in %s', (format) => {
      const result = service.validatePortNameFormat(format);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Unsupported placeholder');
    });

    it('should reject stray braces around a valid placeholder', () => {
      const result = service.validatePortNameFormat('Ethernet{0}}');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Unsupported placeholder');
    });

    it('should list the supported placeholders in the error message', () => {
      const result = service.validatePortNameFormat('{port9}');

      expect(result.errorMessage).toBe(
        'Unsupported placeholder "{port9}" in port name format. Supported: {0}, {1}, {adapter}, {port0}-{port8}, {segment0}-{segment8}'
      );
    });
  });

  describe('validateFirstPortName', () => {
    it('should pass validation when empty', () => {
      expect(service.validateFirstPortName('')).toEqual({ isValid: true });
    });

    it('should accept a literal name', () => {
      expect(service.validateFirstPortName('MgmtEth0/0/CPU0/0')).toEqual({ isValid: true });
      expect(service.validateFirstPortName('mgmt')).toEqual({ isValid: true });
    });

    it('should reject placeholders and braces', () => {
      const result = service.validateFirstPortName('Ethernet{0}');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('First port name should not contain placeholder {0} or special characters');
    });

    it('should reject unmatched braces', () => {
      expect(service.validateFirstPortName('mgmt}0').isValid).toBe(false);
    });
  });

  describe('validatePortSegmentSize', () => {
    it('should pass validation when empty', () => {
      expect(service.validatePortSegmentSize('')).toEqual({ isValid: true });
    });

    it('should accept non-negative integers', () => {
      expect(service.validatePortSegmentSize('0')).toEqual({ isValid: true });
      expect(service.validatePortSegmentSize('4')).toEqual({ isValid: true });
    });

    it('should reject non-integers and negative values', () => {
      expect(service.validatePortSegmentSize('2.5').isValid).toBe(false);
      expect(service.validatePortSegmentSize('-1').isValid).toBe(false);
      expect(service.validatePortSegmentSize('abc').isValid).toBe(false);
    });
  });
});
