import { Injectable } from '@angular/core';

/**
 * @deprecated
 * VirtualBox support is deprecated and will be removed in a future version.
 * This service is no longer maintained and should not be used for new projects.
 *
 * @deprecated Since 3.1.0 - VirtualBox support is being phased out
 */
@Injectable()
export class VirtualBoxConfigurationService {
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
    let networkTypes = [
      'PCnet-PCI II (Am79C970A)',
      'PCNet-FAST III (Am79C973)',
      'Intel PRO/1000 MT Desktop (82540EM)',
      'Intel PRO/1000 T Server  (82543GC)',
      'Intel PRO/1000 MT Server  (82545EM)',
      'Paravirtualized Network (virtio-net)',
    ];

    return networkTypes;
  }
}
