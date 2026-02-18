import { Injectable } from '@angular/core';

@Injectable()
export class VirtualBoxConfigurationService {
  getConsoleTypes() {
    return ['telnet', 'none'];
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
