import { Injectable, inject } from '@angular/core';
import { ValidationService, ValidationResult } from '../base/validation.service';

/**
 * Validation service for Cloud nodes
 *
 * Provides Cloud-specific validation logic including:
 * - Node name validation (required)
 * - Remote console port validation (1-65535 range per gns3server schema)
 * - Network interface name validation
 * - Duplicate interface detection
 *
 * Based on GNS3 server validation:
 * @see https://github.com/GNS3/gns3-server/blob/master/gns3server/schemas/compute/cloud_nodes.py
 *
 * Backend validation rules:
 * - remote_console_port: Optional[int] = Field(None, gt=0, le=65535)
 * - Ethernet/TAP interfaces: name must be unique and exist on system
 * - UDP tunnels: lport/rport must be 1-65535, rhost is required
 */
@Injectable({
  providedIn: 'root',
})
export class CloudValidationService {
  private base = inject(ValidationService);

  /**
   * Validates node name
   * Name is required per CloudBase schema
   */
  validateName(nameValue: string): ValidationResult {
    return this.base.required(nameValue, 'Name');
  }

  /**
   * Validates remote console port number
   * Port must be in range 1-65535 (gns3server: gt=0, le=65535)
   * If empty, validation passes (optional field)
   */
  validateRemoteConsolePort(portValue: string): ValidationResult {
    if (!portValue || portValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    return this.base.validatePortRange(portValue, 1, 65535);
  }

  /**
   * Validates network interface name
   * Must be non-empty string
   * System-level existence check is done server-side
   */
  validateInterfaceName(interfaceName: string): ValidationResult {
    if (!interfaceName || interfaceName.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Interface name is required',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates that interface name is not duplicate
   * Checks against existing interfaces of the same type
   *
   * @param interfaceName - The interface name to check
   * @param existingInterfaces - Array of existing interface names
   * @returns Validation result
   */
  validateUniqueInterface(
    interfaceName: string,
    existingInterfaces: string[]
  ): ValidationResult {
    if (existingInterfaces.includes(interfaceName)) {
      return {
        isValid: false,
        errorMessage: `Interface ${interfaceName} already configured.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates console type
   * Must be one of the supported console types
   * Validation is done via dropdown, but method exists for completeness
   *
   * @param consoleType - The console type to validate
   * @param supportedTypes - Array of supported console types
   * @returns Validation result
   */
  validateConsoleType(
    consoleType: string,
    supportedTypes: string[]
  ): ValidationResult {
    if (!consoleType || consoleType.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Console type is required',
      };
    }

    if (!supportedTypes.includes(consoleType)) {
      return {
        isValid: false,
        errorMessage: `Invalid console type. Must be one of: ${supportedTypes.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates remote console host
   * Can be hostname or IP address (optional field)
   */
  validateRemoteConsoleHost(hostValue: string): ValidationResult {
    if (!hostValue || hostValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    // Basic check for valid hostname/IP format
    // More detailed validation is done server-side
    const hasValidChars = /^[a-zA-Z0-9.-]+$/.test(hostValue);

    if (!hasValidChars) {
      return {
        isValid: false,
        errorMessage: 'Invalid hostname or IP address format',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates remote console HTTP path
   * Optional field, basic format validation
   */
  validateRemoteConsoleHttpPath(pathValue: string): ValidationResult {
    if (!pathValue || pathValue.trim() === '') {
      return { isValid: true }; // Optional field
    }

    // Basic check for valid path format
    // Should start with / if provided
    if (pathValue && !pathValue.startsWith('/')) {
      return {
        isValid: false,
        errorMessage: 'HTTP path must start with /',
      };
    }

    return { isValid: true };
  }
}
