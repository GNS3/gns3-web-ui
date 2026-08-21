import { CustomAdapter } from './qemu/qemu-custom-adapter';
import { ExtraConfig } from './templates/extra-config';

export interface Image {
  compression?: string;
  direct_download_url?: string;
  download_url: string;
  filename: string;
  filesize: any;
  md5sum: string;
  checksum: string;
  version: string;
}

export interface Qemu {
  adapter_type: string;
  adapters: number;
  arch: string;
  boot_priority: string;
  console_type: string;
  hda_disk_interface: string;
  hdb_disk_interface: string;
  hdc_disk_interface: string;
  hdd_disk_interface: string;
  kvm: string;
  ram: number;
  options?: string;
}

export interface Docker {
  adapters: number;
  console_type: string;
  image: string;
  start_command?: string;
  environment?: string;
  extra_hosts?: string;
  extra_volumes?: string[];
  extra_configs?: ExtraConfig[];
  mac_address?: string;
  cpus?: number;
  mem_limit?: number;
  console_http_path?: string;
  console_http_port?: number;
  console_resolution?: string;
}

export interface Dynamips {
  chassis: string;
  nvram: number;
  platform: string;
  ram: number;
  slot0: string;
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
  slot5: string;
  slot6: string;
  slot7: string;
  startup_config: string;
  wic0?: string;
  wic1?: string;
  wic2?: string;
}

export interface Iou {
  ethernet_adapters: number;
  nvram: number;
  ram: number;
  serial_adapters: number;
  startup_config: string;
  console_type?: string;
  console_auto_start?: boolean;
  l1_keepalives?: boolean;
  use_default_iou_values?: boolean;
}

export interface Images {
  bios_image?: string;
  hda_disk_image?: string;
  hdb_disk_image?: string;
  hdc_disk_image?: string;
  hdd_disk_image?: string;
  cdrom_image?: string;
}

export interface Version {
  images: Images;
  name: string;
  // v8: name of the settings group used by this version (server sends a single
  // string, e.g. vyos "1.5 x86_64"), plus version-level overrides
  settings?: string | string[];
  category?: string;
  usage?: string;
  symbol?: string;
  installation_instructions?: string;
  default_username?: string;
  default_password?: string;
}

/**
 * v8 appliance setting group: named emulator configuration block.
 * `template_properties` holds the same keys the v1-v6 format keeps in
 * top-level qemu/docker/iou/dynamips blocks.
 */
export interface ApplianceSetting {
  name: string;
  default?: boolean;
  // server default: true — merge the default group's properties under this one
  inherit_default_properties?: boolean;
  template_type: string;
  template_properties: {
    [key: string]: any;
  };
}

export interface Appliance {
  appliance_id?: string;
  availability: string;
  builtin: boolean;
  category: string;
  description: string;
  documentation_url: string;
  first_port_name: string;
  images: Image[];
  maintainer: string;
  maintainer_email: string;
  name: string;
  port_name_format: string;
  port_segment_size: number;
  product_name: string;
  product_url: string;
  registry_version: number;
  status: string;
  symbol: string;
  default_name_format: string;
  usage: string;
  vendor_name: string;
  vendor_url: string;
  versions: Version[];
  tags: string[];
  custom_adapters?: CustomAdapter[];

  docker?: Docker;
  dynamips?: Dynamips;
  iou?: Iou;
  qemu?: Qemu;

  // v8 fields
  settings?: ApplianceSetting[];
  vendor_logo_url?: string;
  default_username?: string;
  default_password?: string;
  installation_instructions?: string;
  netmiko_device_type?: string;

  emulator?: string;
}
