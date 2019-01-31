import { Injectable } from '@angular/core';
import { QemuTemplate } from '../models/templates/qemu-template';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { Observable, of } from 'rxjs';
import { VirtualBoxTemplate } from '../models/templates/virtualbox-template';
import { EthernetHubTemplate } from '../models/templates/ethernet-hub-template';

@Injectable()
export class TemplateMocksService {
    getQemuTemplate() : Observable<QemuTemplate> {
        let template : QemuTemplate = {
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
            usage: ''
        }
        
        return of(template);
    }

    getVpcsTemplate() : Observable<VpcsTemplate> {
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
            template_type: 'vpcs'
        }

        return of(template);
    }

    getVirtualBoxTemplate() : Observable<VirtualBoxTemplate> {
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
            vmname: ''
        }

        return of(template);
    }

    getEthernetHubTemplate() : Observable<EthernetHubTemplate> {
        let template: EthernetHubTemplate = {
            builtin: false,
            category: 'switch',
            compute_id: 'local',
            default_name_format: 'Hub{0}',
            name: '',
            ports_mapping: [],
            symbol: ':/symbols/hub.svg',
            template_id: '',
            template_type: 'ethernet_hub'
        }

        return of(template);
    }
}
