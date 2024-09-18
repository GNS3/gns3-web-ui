import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CloudTemplate } from '../models/templates/cloud-template';
import { DockerTemplate } from '../models/templates/docker-template';
import { EthernetHubTemplate } from '../models/templates/ethernet-hub-template';
import { EthernetSwitchTemplate } from '../models/templates/ethernet-switch-template';
import { IosTemplate } from '../models/templates/ios-template';
import { IouTemplate } from '../models/templates/iou-template';
import { QemuTemplate } from '../models/templates/qemu-template';
import { TracengTemplate } from '../models/templates/traceng-template';
import { VirtualBoxTemplate } from '../models/templates/virtualbox-template';
import { VmwareTemplate } from '../models/templates/vmware-template';
import { VpcsTemplate } from '../models/templates/vpcs-template';

@Injectable()
export class TemplateMocksService {
  getTracengTemplate(): TracengTemplate {
    let template: TracengTemplate = {
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_type: 'none',
      default_name_format: 'TraceNG{0}',
      ip_address: '',
      name: '',
      symbol: ':/symbols/classic/traceng.svg',
      template_id: '',
      template_type: 'traceng',
    };

    return template;
  }

  getQemuTemplate(): Observable<QemuTemplate> {
    let template: QemuTemplate = {
      adapter_type: 'e1000',
      adapters: 4,
      bios_image: '',
      boot_priority: 'c',
      builtin: false,
      category: 'guest',
      cdrom_image: '',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      cpu_throttling: 0,
      cpus: 1,
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      hda_disk_image: '',
      hda_disk_interface: 'ide',
      hdb_disk_image: '',
      hdb_disk_interface: 'ide',
      hdc_disk_image: '',
      hdc_disk_interface: 'ide',
      hdd_disk_image: '',
      hdd_disk_interface: 'ide',
      initrd: '',
      kernel_command_line: '',
      kernel_image: '',
      legacy_networking: false,
      linked_clone: true,
      mac_address: '',
      name: '',
      on_close: 'power_off',
      options: '-nographic',
      platform: '',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      process_priority: 'normal',
      qemu_path: '',
      ram: 256,
      symbol: ':/symbols/qemu_guest.svg',
      template_id: '',
      template_type: 'qemu',
      usage: '',
      replicate_network_connection_state: true,
      tpm: false,
      uefi: false,
    };

    return of(template);
  }

  getVpcsTemplate(): Observable<VpcsTemplate> {
    let template: VpcsTemplate = {
      base_script_file: 'vpcs_base_config.txt',
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      default_name_format: 'PC{0}',
      name: '',
      symbol: ':/symbols/vpcs_guest.svg',
      template_id: '',
      template_type: 'vpcs',
    };

    return of(template);
  }

  getVirtualBoxTemplate(): Observable<VirtualBoxTemplate> {
    let template: VirtualBoxTemplate = {
      adapter_type: 'Intel PRO/1000 MT Desktop (82540EM)',
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      headless: false,
      linked_clone: false,
      name: '',
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      ram: 0,
      symbol: ':/symbols/vbox_guest.svg',
      template_id: '',
      template_type: 'virtualbox',
      usage: '',
      use_any_adapter: false,
      vmname: '',
    };

    return of(template);
  }

  getCloudNodeTemplate(): Observable<CloudTemplate> {
    let template = {
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      default_name_format: 'Cloud{0}',
      name: '',
      ports_mapping: [],
      remote_console_type: 'none',
      symbol: ':/symbols/cloud.svg',
      template_id: '',
      template_type: 'cloud',
    } as CloudTemplate;

    return of(template);
  }

  getEthernetHubTemplate(): Observable<EthernetHubTemplate> {
    let template: EthernetHubTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      default_name_format: 'Hub{0}',
      name: '',
      ports_mapping: [],
      symbol: ':/symbols/hub.svg',
      template_id: '',
      template_type: 'ethernet_hub',
    };

    return of(template);
  }

  getEthernetSwitchTemplate(): Observable<EthernetSwitchTemplate> {
    let template: EthernetSwitchTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      console_type: 'telnet',
      default_name_format: 'Switch{0}',
      name: '',
      ports_mapping: [],
      symbol: ':/symbols/ethernet_switch.svg',
      template_id: '',
      template_type: 'ethernet_switch',
    };

    return of(template);
  }

  getIosTemplate(): Observable<IosTemplate> {
    let template: IosTemplate = {
      auto_delete_disks: true,
      builtin: false,
      category: 'router',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      default_name_format: 'R{0}',
      disk0: 0,
      disk1: 0,
      exec_area: 64,
      idlemax: 500,
      idlepc: '',
      idlesleep: 30,
      image: '',
      mac_addr: '',
      mmap: true,
      name: '',
      nvram: 128,
      platform: '',
      private_config: '',
      ram: 128,
      sparsemem: true,
      startup_config: '',
      symbol: ':/symbols/router.svg',
      system_id: 'FTX0945W0MY',
      template_id: '',
      template_type: 'dynamips',
      usage: '',
    };

    return of(template);
  }

  getVmwareTemplate(): Observable<VmwareTemplate> {
    let template: VmwareTemplate = {
      adapter_type: 'e1000',
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      headless: false,
      linked_clone: false,
      name: '',
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      symbol: ':/symbols/vmware_guest.svg',
      template_id: '',
      template_type: 'vmware',
      usage: '',
      use_any_adapter: false,
      vmx_path: '',
    };

    return of(template);
  }

  getDockerTemplate(): Observable<DockerTemplate> {
    let template: DockerTemplate = {
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'vm',
      console_auto_start: false,
      console_http_path: '/',
      console_http_port: 80,
      console_resolution: '1024x768',
      console_type: 'telnet',
      mac_address: '',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      environment: '',
      extra_hosts: '',
      image: '',
      name: '',
      start_command: '',
      symbol: ':/symbols/docker_guest.svg',
      template_id: '',
      template_type: 'docker',
      usage: '',
    };

    return of(template);
  }

  getIouTemplate(): Observable<IouTemplate> {
    let template: IouTemplate = {
      builtin: false,
      category: 'switch',
      compute_id: 'vm',
      console_auto_start: false,
      console_type: 'telnet',
      default_name_format: 'IOU{0}',
      ethernet_adapters: 1,
      l1_keepalives: false,
      name: '',
      nvram: 128,
      path: '',
      private_config: '',
      ram: 256,
      serial_adapters: 0,
      startup_config: 'iou_l2_base_startup-config.txt',
      symbol: ':/symbols/multilayer_switch.svg',
      template_id: '',
      template_type: 'iou',
      usage: '',
      use_default_iou_values: true,
    };

    return of(template);
  }
}
