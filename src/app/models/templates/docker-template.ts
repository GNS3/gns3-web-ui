import { CustomAdapter } from '../qemu/qemu-custom-adapter';

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
  image: string;
  name: string;
  start_command: string;
  symbol: string;
  template_id: string;
  template_type: string;
  usage: string;
}
