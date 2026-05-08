/**
 * Validation Services Index
 *
 * Centralized exports for all validation services.
 * Import from this file for cleaner imports:
 *
 * ```typescript
 * import {
 *   ValidationService,
 *   AtmSwitchValidationService,
 *   DockerValidationService
 * } from '@services/validation';
 * ```
 */

// Base validation service
export { ValidationService, ValidationResult } from './base/validation.service';

// Node-specific validation services
export { AtmSwitchValidationService } from './nodes/atm-switch-validation.service';
export { CloudValidationService } from './nodes/cloud-validation.service';
export { DockerValidationService } from './nodes/docker-validation.service';
export { IosValidationService } from './nodes/ios-validation.service';
export { IouValidationService } from './nodes/iou-validation.service';
export { QemuValidationService } from './nodes/qemu-validation.service';

// TODO: Add other node validation services as they are migrated
// export { EthernetHubValidationService } from './nodes/ethernet-hub-validation.service';
// export { EthernetSwitchValidationService } from './nodes/ethernet-switch-validation.service';
// export { FrameRelayValidationService } from './nodes/frame-relay-validation.service';
// export { IosValidationService } from './nodes/ios-validation.service';
// export { IouValidationService } from './nodes/iou-validation.service';
// export { NatValidationService } from './nodes/nat-validation.service';
// export { QemuValidationService } from './nodes/qemu-validation.service';
// export { VirtualBoxValidationService } from './nodes/virtualbox-validation.service';
// export { VmwareValidationService } from './nodes/vmware-validation.service';
// export { VpcsValidationService } from './nodes/vpcs-validation.service';
