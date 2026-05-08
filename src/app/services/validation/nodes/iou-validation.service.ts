import { Injectable, inject } from '@angular/core';
import { ValidationService, ValidationResult } from '../base/validation.service';

@Injectable({ providedIn: 'root' })
export class IouValidationService {
  private base = inject(ValidationService);

  validateName(nameValue: string): ValidationResult {
    return this.base.required(nameValue, 'Name');
  }

  validatePath(pathValue: string): ValidationResult {
    return this.base.required(pathValue, 'IOU image path');
  }

  validateEthernetAdapters(value: string): ValidationResult {
    const r = this.base.required(value, 'Ethernet adapters');
    if (!r.isValid) return r;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'Ethernet adapters must be a non-negative integer' };
    }
    return { isValid: true };
  }

  validateSerialAdapters(value: string): ValidationResult {
    const r = this.base.required(value, 'Serial adapters');
    if (!r.isValid) return r;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(value)) {
      return { isValid: false, errorMessage: 'Serial adapters must be a non-negative integer' };
    }
    return { isValid: true };
  }

  validateRam(ramValue: string): ValidationResult {
    if (!ramValue || ramValue.trim() === '') return { isValid: true };
    const num = parseInt(ramValue, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(ramValue)) {
      return { isValid: false, errorMessage: 'RAM must be a non-negative integer' };
    }
    return { isValid: true };
  }

  validateNvram(nvramValue: string): ValidationResult {
    if (!nvramValue || nvramValue.trim() === '') return { isValid: true };
    const num = parseInt(nvramValue, 10);
    if (isNaN(num) || num < 0 || num !== parseFloat(nvramValue)) {
      return { isValid: false, errorMessage: 'NVRAM must be a non-negative integer' };
    }
    return { isValid: true };
  }
}
