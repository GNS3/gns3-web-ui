import { Injectable, inject } from '@angular/core';
import { ValidationService, ValidationResult } from '../base/validation.service';

// Placeholders accepted by gns3-server's StandardPortFactory
// (controller/ports/port_factory.py): {0} interface number, {1} segment
// number, {adapter} adapter number, {port0}-{port8} / {segment0}-{segment8}
// offsets from the current interface/segment number.
const PORT_NAME_PLACEHOLDER = /\{(?:[01]|adapter|port[0-8]|segment[0-8])\}/g;

@Injectable({ providedIn: 'root' })
export class QemuValidationService {
  private base = inject(ValidationService);

  validateName(value: string): ValidationResult {
    return this.base.required(value, 'Name');
  }

  validateRequiredRam(value: string): ValidationResult {
    return this.base.required(value, 'RAM');
  }

  validateCpus(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 255 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'CPUs must be an integer between 1 and 255' };
    }
    return { isValid: true };
  }

  validateAdapters(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 275 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'Adapters must be an integer between 0 and 275' };
    }
    return { isValid: true };
  }

  validateCpuThrottling(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 800 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'CPU throttling must be between 0 and 800' };
    }
    return { isValid: true };
  }

  validateMacAddress(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    return this.base.validateMacAddress(value);
  }

  validatePortSegmentSize(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'Port segment size must be a non-negative integer' };
    }
    return { isValid: true };
  }

  validateFirstPortName(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    if (/[{}\0]/.test(value)) {
      return {
        isValid: false,
        errorMessage: 'First port name should not contain placeholder {0} or special characters',
      };
    }
    return { isValid: true };
  }

  validatePortNameFormat(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    const clean = value.replace(PORT_NAME_PLACEHOLDER, '');
    // Backend Python str.format() raises on any unsupported brace content
    if (clean.includes('{') || clean.includes('}')) {
      const invalid = clean.match(/\{[^{}]*\}/)?.[0] ?? clean.match(/[{}]/)?.[0] ?? '';
      return {
        isValid: false,
        errorMessage: `Unsupported placeholder "${invalid}" in port name format. Supported: {0}, {1}, {adapter}, {port0}-{port8}, {segment0}-{segment8}`,
      };
    }
    if (clean === value) {
      return {
        isValid: false,
        errorMessage: 'Port name format must include at least one placeholder (e.g., Ethernet{0})',
      };
    }
    return { isValid: true };
  }

  validateMaxcpus(value: string): ValidationResult {
    if (!value || value.trim() === '') return { isValid: true };
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 255 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'Max CPUs must be an integer between 1 and 255' };
    }
    return { isValid: true };
  }

  /**
   * Validates netmiko device type (optional automation field)
   */
  validateNetmikoDeviceType(value: string): ValidationResult {
    return this.base.validateNetmikoDeviceType(value);
  }
}
