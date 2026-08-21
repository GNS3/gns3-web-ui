import { ApplianceMetadata } from '../appliance-metadata';
import { CustomAdapter } from '../qemu/qemu-custom-adapter';
import { ExtraConfig } from './extra-config';

export class DockerTemplate {
  adapters: number;
  builtin: boolean;
  category: string;
  compute_id: string;
  console_auto_start: boolean;
  console_http_path: string;
  console_http_port: number;
  console_resolution: string;
  console_type: string;
  aux_type: string;
  mac_address: string;
  custom_adapters: CustomAdapter[];
  default_name_format: string;
  environment: string;
  extra_hosts: string;
  extra_volumes: string[];
  extra_configs: ExtraConfig[];
  image: string;
  memory: number;
  cpus: number;
  name: string;
  start_command: string;
  symbol: string;
  template_id: string;
  template_type: string;
  usage: string;
  tags: string[];
  netmiko_device_type?: string | null;
  appliance_metadata?: ApplianceMetadata | null;
}
