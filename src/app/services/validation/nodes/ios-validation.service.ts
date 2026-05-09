import { Injectable, inject } from '@angular/core';
import { ValidationService, ValidationResult } from '../base/validation.service';

/**
 * Validation service for IOS (Dynamips) nodes
 *
 * Provides IOS-specific validation logic including:
 * - Name validation (required)
 * - IOS image path validation (required)
 * - RAM/NVRAM validation (required, non-negative, platform-specific)
 * - Idle-PC format validation (0x...)
 * - MAC address format validation
 * - IOMEM range validation (0-100)
 * - Disk size validation (non-negative)
 *
 * Platform-specific defaults (from gns3server):
 * - c7200: RAM=512, NVRAM=512, no iomem
 * - c3725/c3745/c2691: iomem 0-100, RAM=128-256, NVRAM=256
 * - c3600: iomem 5%, RAM=192
 * - c2600: iomem 15%, RAM=160
 * - c1700: iomem 15%, RAM=160, sparsemem=false
 *
 * Based on GNS3 server validation:
 * @see https://github.com/GNS3/gns3-server/blob/master/gns3server/schemas/compute/dynamips_nodes.py
 */
@Injectable({
  providedIn: 'root',
})
export class IosValidationService {
  private base = inject(ValidationService);

  private readonly idlePcRegex = /^(0x[0-9a-fA-F]+)?$/;

  // Platform-specific RAM defaults (used for reference ranges)
  private readonly platformRamLimits: Record<string, { min: number; max: number }> = {
    c7200: { min: 512, max: 512 },
    c3725: { min: 128, max: 256 },
    c3745: { min: 128, max: 256 },
    c2691: { min: 128, max: 256 },
    c3600: { min: 192, max: 192 },
    c2600: { min: 160, max: 160 },
    c1700: { min: 160, max: 160 },
  };

  private readonly platformNvramDefaults: Record<string, number> = {
    c7200: 512,
    c3725: 256,
    c3745: 256,
    c2691: 256,
    c3600: 256,
    c2600: 256,
    c1700: 256,
  };

  /**
   * Validates node name
   * Required field
   */
  validateName(nameValue: string): ValidationResult {
    return this.base.required(nameValue, 'Name');
  }

  /**
   * Validates IOS image path
   * Required field
   */
  validateImagePath(pathValue: string): ValidationResult {
    return this.base.required(pathValue, 'IOS image path');
  }

  /**
   * Validates RAM value
   * Required, non-negative integer
   */
  validateRam(ramValue: string): ValidationResult {
    const required = this.base.required(ramValue, 'RAM');
    if (!required.isValid) return required;

    const num = parseInt(ramValue, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(ramValue)) {
      return { isValid: false, errorMessage: 'RAM must be a non-negative integer' };
    }
    return { isValid: true };
  }

  /**
   * Validates NVRAM value
   * Required, non-negative integer
   */
  validateNvram(nvramValue: string): ValidationResult {
    const required = this.base.required(nvramValue, 'NVRAM');
    if (!required.isValid) return required;

    const num = parseInt(nvramValue, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(nvramValue)) {
      return { isValid: false, errorMessage: 'NVRAM must be a non-negative integer' };
    }
    return { isValid: true };
  }

  /**
   * Validates Idle-PC value
   * Format: 0x[0-9a-fA-F]+
   * Optional field - empty string passes validation
   */
  validateIdlepc(idlepcValue: string): ValidationResult {
    if (!idlepcValue || idlepcValue.trim() === '') {
      return { isValid: true };
    }

    if (!this.idlePcRegex.test(idlepcValue)) {
      return {
        isValid: false,
        errorMessage: 'Invalid Idle-PC format (expected 0x..., e.g. 0x1234)',
      };
    }
    return { isValid: true };
  }

  /**
   * Validates MAC address in IOS format
   * Format: XXXX.XXXX.XXXX
   * Optional field - empty string passes validation
   */
  validateMacAddress(macValue: string): ValidationResult {
    if (!macValue || macValue.trim() === '') {
      return { isValid: true };
    }

    const macPattern = /^([0-9a-fA-F]{4}\.){2}[0-9a-fA-F]{4}$/;
    if (!macPattern.test(macValue)) {
      return {
        isValid: false,
        errorMessage: 'Invalid MAC address format (expected XXXX.XXXX.XXXX)',
      };
    }
    return { isValid: true };
  }

  /**
   * Validates RAM value with platform-specific range
   * Required, checks platform-appropriate range
   *
   * @param ramValue - The RAM value to validate
   * @param platform - The IOS platform (e.g. "c7200", "c2600")
   */
  validateRamForPlatform(ramValue: string, platform: string): ValidationResult {
    const basic = this.validateRam(ramValue);
    if (!basic.isValid) return basic;

    const limits = this.platformRamLimits[platform];
    if (limits) {
      const num = parseInt(ramValue, 10);
      if (num < limits.min || num > limits.max) {
        return {
          isValid: false,
          errorMessage: `RAM for ${platform} should be ${limits.min} MB${limits.max !== limits.min ? ` (${limits.min}-${limits.max})` : ''}`,
        };
      }
    }
    return { isValid: true };
  }

  /**
   * Validates NVRAM value with platform-specific range
   * Required, checks platform-appropriate range
   *
   * @param nvramValue - The NVRAM value to validate
   * @param platform - The IOS platform (e.g. "c7200", "c2600")
   */
  validateNvramForPlatform(nvramValue: string, platform: string): ValidationResult {
    const basic = this.validateNvram(nvramValue);
    if (!basic.isValid) return basic;

    const defaultVal = this.platformNvramDefaults[platform];
    if (defaultVal) {
      const num = parseInt(nvramValue, 10);
      if (num > defaultVal * 2) {
        return {
          isValid: false,
          errorMessage: `NVRAM for ${platform} is typically ${defaultVal} KB. Value ${num} seems unusually high.`,
        };
      }
    }
    return { isValid: true };
  }

  /**
   * Validates I/O memory percentage
   * Must be integer in range 0-100
   * Optional field - empty string passes validation
   */
  validateIomem(iomemValue: string): ValidationResult {
    if (!iomemValue || iomemValue.trim() === '') {
      return { isValid: true };
    }

    const num = parseInt(iomemValue, 10);
    if (isNaN(num) || num < 0 || num > 100 || num !== parseFloat(iomemValue)) {
      return {
        isValid: false,
        errorMessage: 'I/O memory must be an integer between 0 and 100',
      };
    }
    return { isValid: true };
  }

  /**
   * Validates disk size
   * Non-negative integer
   * Optional field - empty string passes validation
   */
  validateDisk(diskValue: string, fieldName: string): ValidationResult {
    if (!diskValue || diskValue.trim() === '') {
      return { isValid: true };
    }

    const num = parseInt(diskValue, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(diskValue)) {
      return {
        isValid: false,
        errorMessage: `${fieldName} must be a non-negative integer`,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates idlemax/idlesleep/exec_area
   * Non-negative integer
   * Optional field - empty string passes validation
   */
  validateNonNegative(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true };
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(value)) {
      return {
        isValid: false,
        errorMessage: `${fieldName} must be a non-negative integer`,
      };
    }
    return { isValid: true };
  }
}
