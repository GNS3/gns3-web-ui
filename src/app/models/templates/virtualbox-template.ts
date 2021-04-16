import { CustomAdapter } from '../qemu/qemu-custom-adapter';

export interface VirtualBoxTemplate {
  adapter_type: string;
  adapters: number;
  builtin: boolean;
  category: string;
  compute_id: string;
  console_auto_start: boolean;
  console_type: string;
  custom_adapters?: CustomAdapter[];
  default_name_format: string;
  first_port_name: string;
  headless: boolean;
  linked_clone: boolean;
  name: string;
  on_close: string;
  port_name_format: string;
  port_segment_size: number;
  ram: number;
  symbol: string;
  template_id: string;
  template_type: string;
  usage: string;
  use_any_adapter: boolean;
  vmname: string;
}
