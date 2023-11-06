import { Injectable } from '@angular/core';

@Injectable()
export class QemuConfigurationService {
  getPlatform() {
    return [
      'x86_64',
      'aarch64',
      'alpha',
      'arm',
      'cris',
      'i386',
      'lm32',
      'm68k',
      'microblaze',
      'microblazeel',
      'mips',
      'mips64',
      'mips64el',
      'mipsel',
      'moxie',
      'or32',
      'ppc',
      'ppc64',
      'ppcemb',
      's390x',
      'sh4',
      'sh4eb',
      'sparc',
      'sparc64',
      'tricore',
      'unicore32',
      'xtensa',
      'xtensaeb',
    ];
  }

  getConsoleTypes() {
    return ['telnet', 'vnc', 'spice', 'spice+agent', 'none'];
  }

  getDiskInterfaces() {
    return ['ide', 'sata', 'scsi', 'sd', 'mtd', 'floppy', 'pflash', 'virtio', 'nvme', 'none'];
  }

  getNetworkTypes() {
    // needs extending of custom adapter component
    let networkTypes = [
      { value: 'e1000', name: 'Intel Gigabit Ethernet' },
      { value: 'e1000-82544gc', name: 'Intel 82544GC Gigabit Ethernet' },
      { value: 'e1000-82545em', name: 'Intel 82545EM Gigabit Ethernet' },
      { value: 'e1000e', name: 'Intel PCIe Gigabit Ethernet' },
      { value: 'i82550', name: 'Intel i82550 Ethernet' },
      { value: 'i82551', name: 'Intel i82551 Ethernet' },
      { value: 'i82557a', name: 'Intel i82557A Ethernet' },
      { value: 'i82557b', name: 'Intel i82557B Ethernet' },
      { value: 'i82557c', name: 'Intel i82557C Ethernet' },
      { value: 'i82558a', name: 'Intel i82558A Ethernet' },
      { value: 'i82558b', name: 'Intel i82558B Ethernet' },
      { value: 'i82559a', name: 'Intel i82559A Ethernet' },
      { value: 'i82559b', name: 'Intel i82559B Ethernet' },
      { value: 'i82559c', name: 'Intel i82559C Ethernet' },
      { value: 'i82559er', name: 'Intel i82559ER Ethernet' },
      { value: 'i82562', name: 'Intel i82562 Ethernet' },
      { value: 'i82801', name: 'Intel i82801 Ethernet' },
      { value: 'igb', name: 'Intel 82576 Gigabit Ethernet' },
      { value: 'ne2k_pci', name: 'NE2000 Ethernet' },
      { value: 'pcnet', name: 'AMD PCNet Ethernet' },
      { value: 'rocker', name: 'Rocker L2 switch device' },
      { value: 'rtl8139', name: 'Realtek 8139 Ethernet' },
      { value: 'virtio-net-pci', name: 'Paravirtualized Network I/O' },
      { value: 'vmxnet3', name: 'VMWare Paravirtualized Ethernet v3' },
    ];

    // let networkTypes = [
    //   'e1000',
    //   'e1000-82544gc',
    //   'e1000-82545em',
    //   'e1000e',
    //   'rocker',
    //   'Intel Gigabit Ethernet',
    //   'i82550',
    //   'i82551',
    //   'i82557a',
    //   'i82557b',
    //   'i82557c',
    //   'i82558a',
    //   'i82558b',
    //   'i82559a',
    //   'i82559b',
    //   'i82559c',
    //   'i82559er',
    //   'i82562',
    //   'i82801',
    //   'ne2k_pci',
    //   'pcnet',
    //   'rtl8139',
    //   'virtio',
    //   'virtio-net-pci',
    //   'vmxnet3',
    // ];

    return networkTypes;
  }

  getBootPriorities() {
    let bootPriorities = [
      ['HDD', 'c'],
      ['CD/DVD-ROM', 'd'],
      ['Network', 'n'],
      ['HDD or Network', 'cn'],
      ['HDD or CD/DVD-ROM', 'cd'],
    ];

    return bootPriorities;
  }

  getOnCloseOptions() {
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

  getPriorities() {
    let priorities = ['realtime', 'very high', 'high', 'normal', 'low', 'very low'];

    return priorities;
  }
}
