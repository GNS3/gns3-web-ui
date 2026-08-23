// Shapes for GET/PUT /v3/settings (gns3_server.conf). Field names mirror the
// server schema exactly (snake_case). Secret fields come back masked
// ("**********") or empty when unset; on PUT, the mask/empty means unchanged,
// a clear-text value overwrites and null removes the option from the file.

// Matches the pydantic SecretStr serialization mask on the server.
export const SECRET_MASK = '**********';

export interface ServerSection {
  local: boolean;
  enable_http_auth: boolean;
  name: string;
  protocol: 'http' | 'https';
  host: string;
  port: number;
  secrets_dir: string | null;
  certfile: string | null;
  certkey: string | null;
  enable_ssl: boolean;
  images_path: string;
  projects_path: string;
  appliances_path: string;
  symbols_path: string;
  configs_path: string;
  resources_path: string | null;
  default_symbol_theme: string;
  allow_raw_images: boolean;
  auto_discover_images: boolean;
  report_errors: boolean;
  additional_images_paths: string[];
  console_start_port_range: number;
  console_end_port_range: number;
  vnc_console_start_port_range: number;
  vnc_console_end_port_range: number;
  udp_start_port_range: number;
  udp_end_port_range: number;
  ubridge_path: string;
  ubridge_control_transport: 'tcp' | 'unix';
  marker_listen_host: string;
  marker_listen_port: number;
  compute_username: string;
  compute_password: string;
  allowed_interfaces: string[];
  default_nat_interface: string | null;
  allow_remote_console: boolean;
  enable_builtin_templates: boolean;
  install_builtin_appliances: boolean;
  skills_repo_url: string;
  skills_repo_branch: string;
  skills_auto_update: boolean;
  mcp_enable_dns_rebinding_protection: boolean;
  mcp_allowed_hosts: string[];
  mcp_allowed_origins: string[];
}

export interface ControllerSection {
  jwt_algorithm: string;
  jwt_access_token_expire_minutes: number;
  jwt_refresh_token_expire_minutes: number;
  default_admin_username: string;
  default_admin_password: string;
}

export interface VpcsSection {
  vpcs_path: string;
}

export interface DynamipsSection {
  allocate_aux_console_ports: boolean;
  mmap_support: boolean;
  dynamips_path: string;
  sparse_memory_support: boolean;
  ghost_ios_support: boolean;
}

export interface IouSection {
  iourc_path: string | null;
  license_check: boolean;
}

export interface QemuSection {
  enable_monitor: boolean;
  monitor_host: string;
  enable_hardware_acceleration: boolean;
  require_hardware_acceleration: boolean;
  allow_unsafe_options: boolean;
  ovmf_firmware_dir: string;
}

export interface WebWiresharkSection {
  enabled: boolean;
  image: string;
  network_subnet: string;
  memory: string;
  cpus: number;
  pids_limit: number;
}

export type ServerSettingsSectionName = 'Server' | 'Controller' | 'VPCS' | 'Dynamips' | 'IOU' | 'Qemu' | 'WebWireshark';

export interface ServerSettings {
  Server: ServerSection;
  Controller: ControllerSection;
  VPCS: VpcsSection;
  Dynamips: DynamipsSection;
  IOU: IouSection;
  Qemu: QemuSection;
  WebWireshark: WebWiresharkSection;
}

// PUT payload: only the submitted sections/options are modified, a null value
// removes the option from the configuration file (restoring its default).
export type ServerSettingsUpdate = {
  [K in ServerSettingsSectionName]?: Partial<ServerSettings[K]>;
};

export interface ServerSettingsUpdateResponse extends ServerSettings {
  restart_required: string[];
}

// settings.updated notification payload: option names only, never values.
export interface SettingsUpdatedEvent {
  changed: string[];
  restart_required: string[];
}
