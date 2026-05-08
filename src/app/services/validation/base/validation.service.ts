import { Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Unified validation service for GNS3 Web UI
 *
 * Provides common validation logic for node configurators and templates.
 * Designed to work with Angular's model() signals and Zoneless architecture.
 *
 * @example
 * ```typescript
 * // In a component
 * readonly portNumber = model('');
 * readonly portError = signal('');
 *
 * constructor(private validationService: ValidationService) {}
 *
 * validatePort() {
 *   const result = this.validationService.validatePort(this.portNumber());
 *   this.portError.set(result.errorMessage || '');
 *   return result.isValid;
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  // Error message templates
  private readonly errorMessages = {
    required: (fieldName: string) => `${fieldName} is required`,
    portInvalid: 'Port must be a non-negative integer',
    portOutOfRange: (min: number, max: number) =>
      `Port must be between ${min} and ${max}`,
    numberInvalid: (fieldName: string) => `${fieldName} must be a valid number`,
    numberOutOfRange: (fieldName: string, min: number, max: number) =>
      `${fieldName} must be between ${min} and ${max}`,
    numberTooSmall: (fieldName: string, min: number) =>
      `${fieldName} must be at least ${min}`,
    formatInvalid: (fieldName: string, format: string) =>
      `${fieldName} must match the format: ${format}`,
    duplicate: 'This entry already exists',
    mappingFormat: (type: 'VC' | 'VP') =>
      type === 'VC'
        ? 'Mapping must be in format: port:vpi:vci (e.g., 0:0:100)'
        : 'Mapping must be in format: port:vpi (e.g., 0:0)',
  };

  /**
   * Validates that a value is not empty
   *
   * @param value - The value to validate
   * @param fieldName - The field name for error messages
   * @returns Validation result
   */
  required(value: string, fieldName: string = 'Field'): ValidationResult {
    const isValid = value !== null && value !== undefined && value.trim() !== '';
    return {
      isValid: isValid,
      errorMessage: isValid ? undefined : this.errorMessages.required(fieldName),
    };
  }

  /**
   * Validates that a port number is a non-negative integer
   *
   * @param portValue - The port value to validate
   * @returns Validation result
   */
  validatePort(portValue: string): ValidationResult {
    if (!portValue || portValue.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required('Port'),
      };
    }

    const port = parseInt(portValue, 10);
    const isValid =
      !isNaN(port) && port >= 0 && port === parseFloat(portValue);

    return {
      isValid,
      errorMessage: isValid ? undefined : this.errorMessages.portInvalid,
    };
  }

  /**
   * Creates a validator function for integer fields
   *
   * This factory method generates a validator function that can be reused
   * across different components to eliminate code duplication.
   *
   * @param fieldName - Display name for error messages
   * @param min - Minimum allowed value (inclusive)
   * @returns A validator function that takes a string value and returns ValidationResult
   *
   * @example
   * ```typescript
   * // In a service
   * private readonly validatePort = this.base.createIntegerValidator('Port', 0);
   *
   * // Usage
   * const result = this.validatePort(userInput);
   * ```
   */
  createIntegerValidator(fieldName: string, min: number) {
    return (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return {
          isValid: false,
          errorMessage: `${fieldName} is required`,
        };
      }

      const num = parseInt(value, 10);
      const isValid = !isNaN(num) && num >= min && num === parseFloat(value);

      const minDescription = min === 0 ? 'non-negative' : `positive (>= ${min})`;

      return {
        isValid,
        errorMessage: isValid
          ? undefined
          : `${fieldName} must be a ${minDescription} integer`,
      };
    };
  }

  /**
   * Validates that a port number is within a specific range
   *
   * @param portValue - The port value to validate
   * @param min - Minimum port number (inclusive)
   * @param max - Maximum port number (inclusive)
   * @returns Validation result
   */
  validatePortRange(
    portValue: string,
    min: number = 0,
    max: number = 65535
  ): ValidationResult {
    const baseValidation = this.validatePort(portValue);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const port = parseInt(portValue, 10);
    const isValid = port >= min && port <= max;

    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : this.errorMessages.portOutOfRange(min, max),
    };
  }

  /**
   * Validates that a value is a positive integer (>= 1)
   * Used for VPI/VCI validation
   *
   * @param value - The value to validate
   * @param fieldName - The field name for error messages
   * @returns Validation result
   */
  validatePositiveInteger(
    value: string,
    fieldName: string = 'Value'
  ): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required(fieldName),
      };
    }

    const num = parseInt(value, 10);
    const isValid = !isNaN(num) && num >= 1 && num === parseFloat(value);

    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : this.errorMessages.numberTooSmall(fieldName, 1),
    };
  }

  /**
   * Validates that a number is within a specific range
   *
   * @param value - The value to validate
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @param fieldName - The field name for error messages
   * @returns Validation result
   */
  validateNumberRange(
    value: string,
    min: number,
    max: number,
    fieldName: string = 'Value'
  ): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required(fieldName),
      };
    }

    const num = parseFloat(value);
    const isValid = !isNaN(num) && num >= min && num <= max;

    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : this.errorMessages.numberOutOfRange(fieldName, min, max),
    };
  }

  /**
   * Validates ATM switch VC mapping format: port:vpi:vci
   * Format: number:number:number
   *
   * @param mapping - The mapping string to validate
   * @returns Validation result
   */
  validateAtmVcMapping(mapping: string): ValidationResult {
    if (!mapping || mapping.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required('Mapping'),
      };
    }

    const pvcEntry = /^([0-9]*):([0-9]*):([0-9]*)$/;
    const isValid = pvcEntry.test(mapping);

    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : this.errorMessages.mappingFormat('VC'),
    };
  }

  /**
   * Validates ATM switch VP mapping format: port:vpi
   * Format: number:number
   *
   * @param mapping - The mapping string to validate
   * @returns Validation result
   */
  validateAtmVpMapping(mapping: string): ValidationResult {
    if (!mapping || mapping.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required('Mapping'),
      };
    }

    const parts = mapping.split(':');
    if (parts.length !== 2) {
      return {
        isValid: false,
        errorMessage: this.errorMessages.mappingFormat('VP'),
      };
    }

    const [port, vpi] = parts;
    const portValid = this.validatePort(port);
    const vpiValid = this.validatePort(vpi);

    const isValid = portValid.isValid && vpiValid.isValid;

    return {
      isValid,
      errorMessage: isValid ? undefined : this.errorMessages.mappingFormat('VP'),
    };
  }

  /**
   * Validates Frame Relay switch DLCI mapping format: port:dlci
   * Format: number:number (DLCI is typically 16-1007)
   *
   * @param mapping - The mapping string to validate
   * @returns Validation result
   */
  validateFrameRelayMapping(mapping: string): ValidationResult {
    if (!mapping || mapping.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required('Mapping'),
      };
    }

    const parts = mapping.split(':');
    if (parts.length !== 2) {
      return {
        isValid: false,
        errorMessage: 'Mapping must be in format: port:dlci (e.g., 0:100)',
      };
    }

    const [port, dlci] = parts;

    // Validate port
    const portValid = this.validatePort(port);
    if (!portValid.isValid) {
      return {
        isValid: false,
        errorMessage: 'Invalid port number',
      };
    }

    // Validate DLCI (16-1007 is the valid range)
    const dlciNum = parseInt(dlci, 10);
    const dlciValid =
      !isNaN(dlciNum) && dlciNum >= 16 && dlciNum <= 1007;

    return {
      isValid: dlciValid,
      errorMessage: dlciValid
        ? undefined
        : 'DLCI must be between 16 and 1007',
    };
  }

  /**
   * Validates IP address format (IPv4)
   *
   * @param ip - The IP address to validate
   * @returns Validation result
   */
  validateIpAddress(ip: string): ValidationResult {
    if (!ip || ip.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'IP address is required',
      };
    }

    // IPv4 regex pattern
    const ipv4Pattern =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const isValid = ipv4Pattern.test(ip);

    return {
      isValid,
      errorMessage: isValid ? undefined : 'Invalid IP address format',
    };
  }

  /**
   * Checks if a value already exists in an array
   * Used for duplicate detection
   *
   * @param value - The value to check
   * @param existingValues - Array of existing values
   * @param currentValue - The current value being edited (optional, for edit scenarios)
   * @returns Validation result
   */
  validateUnique(
    value: string,
    existingValues: string[],
    currentValue?: string
  ): ValidationResult {
    const isDuplicate =
      currentValue !== undefined
        ? existingValues.includes(value) && value !== currentValue
        : existingValues.includes(value);

    return {
      isValid: !isDuplicate,
      errorMessage: isDuplicate ? this.errorMessages.duplicate : undefined,
    };
  }

  /**
   * Validates a hostname according to RFC 1123
   *
   * @param hostname - The hostname to validate
   * @returns Validation result
   */
  validateHostname(hostname: string): ValidationResult {
    if (!hostname || hostname.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Hostname is required',
      };
    }

    // Hostname regex (RFC 1123 compliant)
    // Allows: letters, digits, hyphens, dots (but not at start/end)
    const hostnamePattern =
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/;
    const isValid = hostnamePattern.test(hostname) && hostname.length <= 253;

    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : 'Invalid hostname format (use letters, numbers, hyphens, and dots)',
    };
  }

  /**
   * Generic regex validation
   *
   * @param value - The value to validate
   * @param pattern - The regex pattern to match
   * @param fieldName - The field name for error messages
   * @param formatHint - Optional hint about the expected format
   * @returns Validation result
   */
  private readonly macRegex = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/;

  /**
   * Validates a MAC address format (XX:XX:XX:XX:XX:XX)
   * Empty value passes validation (optional field)
   */
  validateMacAddress(macValue: string): ValidationResult {
    if (!macValue || macValue.trim() === '') {
      return { isValid: true };
    }
    if (!this.macRegex.test(macValue)) {
      return {
        isValid: false,
        errorMessage: 'Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)',
      };
    }
    return { isValid: true };
  }

  validatePattern(
    value: string,
    pattern: RegExp,
    fieldName: string = 'Field',
    formatHint?: string
  ): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        errorMessage: this.errorMessages.required(fieldName),
      };
    }

    const isValid = pattern.test(value);

    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : formatHint || this.errorMessages.formatInvalid(fieldName, pattern.toString()),
    };
  }
}
