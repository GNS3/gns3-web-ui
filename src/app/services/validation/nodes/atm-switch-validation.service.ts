import { Injectable, inject } from '@angular/core';
import { ValidationService, ValidationResult } from '../base/validation.service';

/**
 * Validation service for ATM Switch nodes
 *
 * Provides ATM-specific validation logic including:
 * - VC (Virtual Channel) mapping format: port:vpi:vci
 * - VP (Virtual Path) mapping format: port:vpi
 * - Port number validation
 * - VPI/VCI range validation
 *
 * @see https://github.com/GNS3/gns3-server/blob/master/gns3server/compute/dynamips/nodes/atm_switch.py
 */
@Injectable({
  providedIn: 'root',
})
export class AtmSwitchValidationService {
  private base = inject(ValidationService);

  /**
   * Validates source port number for ATM switch
   * Port must be a non-negative integer
   */
  readonly validateSourcePort = this.base.createIntegerValidator('Source Port', 0);

  /**
   * Validates destination port number for ATM switch
   * Port must be a non-negative integer
   */
  readonly validateDestinationPort = this.base.createIntegerValidator('Destination Port', 0);

  /**
   * Validates source VCI (Virtual Channel Identifier)
   * VCI must be a positive integer (>= 1)
   */
  readonly validateSourceVci = this.base.createIntegerValidator('Source VCI', 1);

  /**
   * Validates destination VCI (Virtual Channel Identifier)
   * VCI must be a positive integer (>= 1)
   */
  readonly validateDestinationVci = this.base.createIntegerValidator('Destination VCI', 1);

  /**
   * Validates source VPI (Virtual Path Identifier)
   * VPI must be a positive integer (>= 1)
   */
  readonly validateSourceVpi = this.base.createIntegerValidator('Source VPI', 1);

  /**
   * Validates destination VPI (Virtual Path Identifier)
   * VPI must be a positive integer (>= 1)
   */
  readonly validateDestinationVpi = this.base.createIntegerValidator('Destination VPI', 1);

  /**
   * Validates VC (Virtual Channel) mapping entry format
   * Format: port:vpi:vci (e.g., "0:0:100" -> "1:0:200")
   *
   * Based on GNS3 server validation:
   * pvc_entry = re.compile(r"""^([0-9]*):([0-9]*):([0-9]*)$""")
   *
   * @param mapping - The mapping string to validate
   * @returns Validation result with error message if invalid
   */
  validateVcMapping(mapping: string): ValidationResult {
    if (!mapping || mapping.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Mapping is required',
      };
    }

    // VC format: port:vpi:vci
    const pvcEntry = /^([0-9]*):([0-9]*):([0-9]*)$/;
    const isValid = pvcEntry.test(mapping);

    if (!isValid) {
      return {
        isValid: false,
        errorMessage: 'VC mapping must be in format: port:vpi:vci (e.g., 0:0:100)',
      };
    }

    // Additional validation: extract and validate each component
    const parts = mapping.split(':');
    const [port, vpi, vci] = parts;

    // Validate port is non-negative integer
    if (port && !this.base.validatePort(port).isValid) {
      return {
        isValid: false,
        errorMessage: 'Port must be a non-negative integer',
      };
    }

    // Validate VPI is non-negative integer (can be 0)
    if (vpi && !this.base.validatePort(vpi).isValid) {
      return {
        isValid: false,
        errorMessage: 'VPI must be a non-negative integer',
      };
    }

    // Validate VCI is positive integer (>= 1)
    if (vci && !this.base.validatePositiveInteger(vci, 'VCI').isValid) {
      return {
        isValid: false,
        errorMessage: 'VCI must be a positive integer (>= 1)',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates VP (Virtual Path) mapping entry format
   * Format: port:vpi (e.g., "0:0" -> "1:0")
   *
   * Simpler format used when useVpiOnly is enabled
   *
   * @param mapping - The mapping string to validate
   * @returns Validation result with error message if invalid
   */
  validateVpMapping(mapping: string): ValidationResult {
    if (!mapping || mapping.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Mapping is required',
      };
    }

    // VP format: port:vpi
    const parts = mapping.split(':');
    if (parts.length !== 2) {
      return {
        isValid: false,
        errorMessage: 'VP mapping must be in format: port:vpi (e.g., 0:0)',
      };
    }

    const [port, vpi] = parts;

    // Validate port
    const portValid = this.base.validatePort(port);
    if (!portValid.isValid) {
      return {
        isValid: false,
        errorMessage: 'Port must be a non-negative integer',
      };
    }

    // Validate VPI
    const vpiValid = this.base.validatePort(vpi);
    if (!vpiValid.isValid) {
      return {
        isValid: false,
        errorMessage: 'VPI must be a non-negative integer',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates a complete mapping entry for addition
   * Checks all fields based on useVpiOnly mode
   *
   * @param sourcePort - Source port number
   * @param sourceVci - Source VCI
   * @param destinationPort - Destination port number
   * @param destinationVci - Destination VCI
   * @param sourceVpi - Source VPI (required if not useVpiOnly)
   * @param destinationVpi - Destination VPI (required if not useVpiOnly)
   * @param useVpiOnly - Whether to use VP format (true) or VC format (false)
   * @returns Validation result
   */
  validateMappingEntry(
    sourcePort: string,
    sourceVci: string,
    destinationPort: string,
    destinationVci: string,
    sourceVpi: string,
    destinationVpi: string,
    useVpiOnly: boolean
  ): ValidationResult {
    // Validate source port
    const sourcePortValid = this.validateSourcePort(sourcePort);
    if (!sourcePortValid.isValid) {
      return sourcePortValid;
    }

    // Validate source VCI
    const sourceVciValid = this.validateSourceVci(sourceVci);
    if (!sourceVciValid.isValid) {
      return sourceVciValid;
    }

    // Validate destination port
    const destPortValid = this.validateDestinationPort(destinationPort);
    if (!destPortValid.isValid) {
      return destPortValid;
    }

    // Validate destination VCI
    const destVciValid = this.validateDestinationVci(destinationVci);
    if (!destVciValid.isValid) {
      return destVciValid;
    }

    // If not using VPI only mode, validate VPI fields
    if (!useVpiOnly) {
      const sourceVpiValid = this.validateSourceVpi(sourceVpi);
      if (!sourceVpiValid.isValid) {
        return sourceVpiValid;
      }

      const destVpiValid = this.validateDestinationVpi(destinationVpi);
      if (!destVpiValid.isValid) {
        return destVpiValid;
      }
    }

    return { isValid: true };
  }

  /**
   * Validates that a mapping is unique (not already in the list)
   *
   * @param portIn - The input port mapping to check
   * @param existingMappings - Array of existing mappings
   * @returns Validation result
   */
  validateUniqueMapping(
    portIn: string,
    existingMappings: Array<{ portIn: string; portOut: string }>
  ): ValidationResult {
    const isDuplicate = existingMappings.some(
      (mapping) => mapping.portIn === portIn
    );

    if (isDuplicate) {
      return {
        isValid: false,
        errorMessage: 'This mapping already exists',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates the generated mapping string format
   * Used for final validation before sending to server
   *
   * @param portIn - Input mapping string
   * @param portOut - Output mapping string
   * @param useVpiOnly - Whether using VP format
   * @returns Validation result
   */
  validateGeneratedMapping(
    portIn: string,
    portOut: string,
    useVpiOnly: boolean
  ): ValidationResult {
    if (useVpiOnly) {
      return this.validateVpMapping(portIn);
    } else {
      return this.validateVcMapping(portIn);
    }
  }
}
