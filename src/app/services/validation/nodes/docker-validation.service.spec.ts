import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ValidationService } from '../base/validation.service';
import { DockerValidationService } from './docker-validation.service';
import { ExtraConfig } from '@models/templates/extra-config';

describe('DockerValidationService', () => {
  let service: DockerValidationService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [ValidationService, DockerValidationService],
    });

    service = TestBed.inject(DockerValidationService);
  });

  describe('validateExtraConfigs', () => {
    it('should pass validation for an empty list', () => {
      const result = service.validateExtraConfigs([]);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for entirely blank rows', () => {
      const result = service.validateExtraConfigs([{ target: '', content: '' }, { target: '   ', content: '' }]);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should pass validation for absolute targets', () => {
      const configs: ExtraConfig[] = [
        { target: '/firstboot.cfg', content: 'hostname xrd' },
        { target: '/etc/frr/frr.conf', content: '' },
      ];

      const result = service.validateExtraConfigs(configs);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail validation for content without a target', () => {
      const result = service.validateExtraConfigs([{ target: '/firstboot.cfg', content: 'ok' }, { target: '', content: 'hostname xrd' }]);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Extra files, row 2: file content requires a container target path');
    });

    it('should fail validation for a relative target path', () => {
      const result = service.validateExtraConfigs([{ target: 'etc/frr/frr.conf', content: 'frr config' }]);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Extra files, row 1: target "etc/frr/frr.conf" must be an absolute path (e.g., /firstboot.cfg)');
    });

    it('should fail validation for a target containing ..', () => {
      const result = service.validateExtraConfigs([{ target: '/a/../etc/passwd', content: '' }]);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Extra files, row 1: target \"/a/../etc/passwd\" must not contain '..'");
    });

    it('should fail validation for duplicate targets', () => {
      const configs: ExtraConfig[] = [
        { target: '/etc/frr/frr.conf', content: 'first' },
        { target: '/firstboot.cfg', content: 'other' },
        { target: '/etc/frr/frr.conf', content: 'second' },
      ];

      const result = service.validateExtraConfigs(configs);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Extra files, row 3: duplicate target path "/etc/frr/frr.conf"');
    });

    it('should pass validation for a target with empty content', () => {
      const result = service.validateExtraConfigs([{ target: '/etc/nginx/nginx.conf', content: '' }]);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });
});
