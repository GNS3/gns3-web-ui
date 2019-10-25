import { Label } from './label';
import { Port } from '../../models/port';
import { CustomAdapter } from '../../models/qemu/qemu-custom-adapter';

export class PortsMapping {
  name: string;
  interface?: string;
  port_number: number;
  type?: string;
}

export class Properties {
  adapter_type: string;
  adapters: number;
  headless: boolean;
  linked_clone: boolean;
  on_close: string;
  ram: number;
  nvram: number;
  usage: string;
  use_any_adapter: boolean;
  vmname: string;
  ports_mapping: PortsMapping[];
  mappings: any;
  bios_image: string;
  bios_image_md5sum?: any;
  boot_priority: string;
  cdrom_image: string;
  cdrom_image_md5sum?: any;
  cpu_throttling: number;
  cpus: number;
  hda_disk_image: string;
  hda_disk_image_md5sum: string;
  hda_disk_interface: string;
  hdb_disk_image: string;
  hdb_disk_image_md5sum?: any;
  hdb_disk_interface: string;
  hdc_disk_image: string;
  hdc_disk_image_md5sum?: any;
  hdc_disk_interface: string;
  hdd_disk_image: string;
  hdd_disk_image_md5sum?: any;
  hdd_disk_interface: string;
  initrd: string;
  initrd_md5sum?: any;
  kernel_command_line: string;
  kernel_image: string;
  kernel_image_md5sum?: any;
  legacy_networking: boolean;
  mac_address: string;
  options: string;
  platform: string;
  process_priority: string;
  qemu_path: string;
  environment: string;
  extra_hosts: string;
}

export class Node {
  command_line: string;
  compute_id: string;
  console: number;
  console_auto_start: boolean;
  console_host: string;
  console_type: string;
  custom_adapters?: CustomAdapter[];
  ethernet_adapters?: any;
  serial_adapters?: any;
  first_port_name: string;
  height: number;
  label: Label;
  locked: boolean;
  name: string;
  node_directory: string;
  node_id: string;
  node_type: string;
  port_name_format: string;
  port_segment_size: number;
  ports: Port[];
  project_id: string;
  properties: Properties;
  status: string;
  symbol: string;
  symbol_url: string; // @TODO: full URL to symbol, move to MapNode once converters are moved to app module
  usage?: string;
  width: number;
  x: number;
  y: number;
  z: number;
}
