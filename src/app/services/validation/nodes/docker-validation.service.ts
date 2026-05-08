import { Injectable, inject } from '@angular/core';
import { ValidationService, ValidationResult } from '../base/validation.service';

/**
 * Validation service for Docker nodes and templates
 *
 * Provides Docker-specific validation logic including:
 * - Node name validation (required)
 * - Adapter count validation (0-99 for node, 0-100 for template)
 * - MAC address format validation
 * - Memory/CPU non-negative validation
 * - Console port range validation (1-65535)
 * - Console resolution format validation (e.g. "1024x768")
 *
 * Based on GNS3 server validation:
 * @see https://github.com/GNS3/gns3-server/blob/master/gns3server/schemas/compute/docker_nodes.py
 * @see https://github.com/GNS3/gns3-server/blob/master/gns3server/schemas/controller/templates/docker_templates.py
 *
 * Backend validation rules:
 * - adapters: ge=0, le=99 (node) / ge=0, le=100 (template)
 * - mac_address: pattern "^([0-9a-fA-F]{2}[:]){5}([0-9a-fA-F]{2})$"
 * - memory: ge=0 (MB)
 * - cpus: ge=0 (float)
 * - console_http_port: gt=0, le=65535
 * - console_resolution: pattern "^[0-9]+x[0-9]+$"
 * - console/aux: gt=0, le=65535
 */
@Injectable({
  providedIn: 'root',
})
export class DockerValidationService {
  private base = inject(ValidationService);

  private readonly macRegex = /^([0-9a-fA-F]{2}[:]){5}([0-9a-fA-F]{2})$/;
  private readonly resolutionRegex = /^[0-9]+x[0-9]+$/;

  /**
   * Validates node/template name
   * Name is required
   */
  validateName(nameValue: string): ValidationResult {
    return this.base.required(nameValue, 'Name');
  }

  /**
   * Validates adapter count
   * Must be integer in range 0-99 (node) or 0-100 (template)
   */
  validateAdapters(adaptersValue: string, maxAdapters: number = 99): ValidationResult {
    if (!adaptersValue || adaptersValue.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Adapters is required',
      };
    }

    const num = parseInt(adaptersValue, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(adaptersValue)) {
      return {
        isValid: false,
        errorMessage: `Adapters must be a non-negative integer (0-${maxAdapters})`,
      };
    }

    if (num > maxAdapters) {
      return {
        isValid: false,
        errorMessage: `Adapters must not exceed ${maxAdapters}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates MAC address format
   * Format: XX:XX:XX:XX:XX:XX
   * Optional field - empty string passes validation
   */
  validateMacAddress(macValue: string): ValidationResult {
    if (!macValue || macValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    if (!this.macRegex.test(macValue)) {
      return {
        isValid: false,
        errorMessage: 'Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates memory value
   * Must be non-negative integer (MB)
   * Optional field - empty string passes validation
   */
  validateMemory(memoryValue: string): ValidationResult {
    if (!memoryValue || memoryValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    const portValidation = this.base.validatePort(memoryValue);
    if (!portValidation.isValid) {
      return {
        isValid: false,
        errorMessage: 'Memory must be a non-negative integer',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates CPU count
   * Must be non-negative number (float)
   * Optional field - empty string passes validation
   */
  validateCpus(cpusValue: string): ValidationResult {
    if (!cpusValue || cpusValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    const num = parseFloat(cpusValue);
    if (isNaN(num) || num < 0) {
      return {
        isValid: false,
        errorMessage: 'CPUs must be a non-negative number',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates console HTTP port
   * Must be in range 1-65535
   * Optional field - empty string passes validation
   */
  validateConsoleHttpPort(portValue: string): ValidationResult {
    if (!portValue || portValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    return this.base.validatePortRange(portValue, 1, 65535);
  }

  /**
   * Validates console HTTP path
   * Required field - must be non-empty
   */
  validateConsoleHttpPath(pathValue: string): ValidationResult {
    return this.base.required(pathValue, 'Console HTTP path');
  }

  /**
   * Validates console resolution format
   * Format: "WIDTHxHEIGHT" (e.g. "1024x768")
   * Optional field - empty string passes validation
   */
  validateConsoleResolution(resolutionValue: string): ValidationResult {
    if (!resolutionValue || resolutionValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    if (!this.resolutionRegex.test(resolutionValue)) {
      return {
        isValid: false,
        errorMessage: 'Invalid resolution format (expected WIDTHxHEIGHT, e.g. 1024x768)',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates environment variable format
   * Each line must be KEY=VALUE format with uppercase key names
   * Optional field - empty string passes validation
   *
   * @param envValue - The environment variables string
   * @param sectionLabel - Label for the section (e.g., "Advanced > Environment")
   */
  validateEnvironment(envValue: string, sectionLabel: string = 'Environment'): ValidationResult {
    if (!envValue || envValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    const lines = envValue.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const eqIndex = line.indexOf('=');
      if (eqIndex <= 0) {
        return {
          isValid: false,
          errorMessage: `${sectionLabel}, line ${i + 1}: Invalid format (expected KEY=VALUE)`,
        };
      }

      const key = line.substring(0, eqIndex);
      if (key !== key.toUpperCase()) {
        return {
          isValid: false,
          errorMessage: `${sectionLabel}, line ${i + 1}: Variable name "${key}" should be uppercase (e.g., ${key.toUpperCase()}=value)`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates console or aux port
   * Must be in range 1-65535
   * Optional field - empty string passes validation
   */
  validateConsolePort(portValue: string): ValidationResult {
    if (!portValue || portValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    return this.base.validatePortRange(portValue, 1, 65535);
  }
}
