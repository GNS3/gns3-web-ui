import { Injectable } from '@angular/core';

/**
 * @deprecated
 * VMware support is deprecated and will be removed in a future version.
 * This service is no longer maintained and should not be used for new projects.
 *
 * @deprecated Since 3.1.0 - VMware support is being phased out
 */
@Injectable()
export class VmwareConfigurationService {
  getConsoleTypes() {
    return ['telnet', 'ssh', 'none'];
  }

  getOnCloseoptions() {
    let onCloseOptions = [
      ['Power off the VM', 'power_off'],
      ['Send the shutdown signal (ACPI)', 'shutdown_signal'],
      ['Save the VM state', 'save_vm_state'],
    ];

    return onCloseOptions;
  }

  getCategories() {
    let categories = [
      ['Default', 'guest'],
      ['Routers', 'router'],
      ['Switches', 'switch'],
      ['End devices', 'guest'],
      ['Security devices', 'firewall'],
    ];

    return categories;
  }

  getNetworkTypes() {
    let networkTypes = ['default', 'e1000', 'e1000e', 'flexible', 'vlance', 'vmxnet', 'vmxnet2', 'vmxnet3'];

    return networkTypes;
  }
}
