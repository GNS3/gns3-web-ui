// Metadata driving the server settings form: one descriptor per writable
// /v3/settings option, grouped per section. Field constraints and defaults
// mirror gns3server/schemas/config.py; RESTART_REQUIRED mirrors the fixed
// option set in gns3server/api/routes/controller/settings.py.

import { ServerSettingsSectionName } from './server-settings';

export type SettingsFieldValue = boolean | number | string | string[] | null;

export type FieldType = 'boolean' | 'int' | 'float' | 'string' | 'enum' | 'list' | 'secret';

export interface SettingsFieldMeta {
  key: string;
  label: string;
  type: FieldType;
  // Populated at runtime from the server OpenAPI description (see
  // settings-schema.ts) — never compiled, so the two texts cannot drift.
  hint?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  // Server built-in default (gns3server/schemas/config.py); omitted when the
  // default is resolved on the server (e.g. the hostname-derived server name).
  defaultValue?: SettingsFieldValue;
  restartRequired: boolean;
  // Layout hint: 'half' shares the row with its neighbour, 'third' fits three
  // fields per row, 'two-thirds' pairs with a 'third' (roughly 65/35),
  // 'half-row' is a half-width control on a row of its own; unmarked fields
  // occupy a full row.
  width?: 'half' | 'third' | 'two-thirds' | 'half-row';
}

export interface SettingsGroupMeta {
  id: string;
  label: string;
  fields: SettingsFieldMeta[];
}

export interface SettingsSectionMeta {
  name: ServerSettingsSectionName;
  label: string;
  icon: string;
  groups: SettingsGroupMeta[];
}

// Options that only take effect after a server restart — verbatim from
// gns3server/api/routes/controller/settings.py (RESTART_REQUIRED).
export const RESTART_REQUIRED = new Set<string>([
  'Server.host',
  'Server.port',
  'Server.protocol',
  'Server.enable_ssl',
  'Server.certfile',
  'Server.certkey',
  'Server.secrets_dir',
  'Server.images_path',
  'Server.projects_path',
  'Server.appliances_path',
  'Server.symbols_path',
  'Server.configs_path',
  'Server.resources_path',
  'Server.console_start_port_range',
  'Server.console_end_port_range',
  'Server.vnc_console_start_port_range',
  'Server.vnc_console_end_port_range',
  'Server.udp_start_port_range',
  'Server.udp_end_port_range',
  'Server.enable_builtin_templates',
  'Server.install_builtin_appliances',
  'Server.skills_repo_url',
  'Server.skills_repo_branch',
  'Server.skills_auto_update',
  'Server.ubridge_path',
  'Controller.default_admin_username',
  'Controller.default_admin_password',
]);

type SettingsFieldDescriptor = Omit<SettingsFieldMeta, 'restartRequired'>;

function buildSection(
  name: ServerSettingsSectionName,
  label: string,
  icon: string,
  groups: { id: string; label: string; fields: SettingsFieldDescriptor[] }[],
): SettingsSectionMeta {
  return {
    name,
    label,
    icon,
    groups: groups.map((group) => ({
      ...group,
      fields: group.fields.map((field) => ({
        ...field,
        restartRequired: RESTART_REQUIRED.has(`${name}.${field.key}`),
      })),
    })),
  };
}

const PORT_MIN = 1;
const PORT_MAX = 65535;
const VNC_PORT_MIN = 5900;

export const SETTINGS_METADATA: SettingsSectionMeta[] = [
  buildSection('Server', 'Server', 'dns', [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'name', label: 'Server name', type: 'string', width: 'half-row' },
        { key: 'local', label: 'Local server', type: 'boolean', width: 'half', defaultValue: false },
        { key: 'report_errors', label: 'Report errors', type: 'boolean', width: 'half', defaultValue: true },
      ],
    },
    {
      id: 'network',
      label: 'Network and security',
      fields: [
        { key: 'protocol', label: 'Protocol', type: 'enum', width: 'third', defaultValue: 'http', options: [{ value: 'http', label: 'HTTP' }, { value: 'https', label: 'HTTPS' }] },
        { key: 'host', label: 'Listen host', type: 'string', width: 'third', defaultValue: '0.0.0.0' },
        { key: 'port', label: 'Listen port', type: 'int', width: 'third', defaultValue: 3080, min: PORT_MIN, max: PORT_MAX },
        { key: 'enable_ssl', label: 'Enable SSL', type: 'boolean', width: 'half', defaultValue: false },
        { key: 'enable_http_auth', label: 'HTTP authentication', type: 'boolean', width: 'half', defaultValue: true },
        { key: 'certfile', label: 'Certificate file', type: 'string', width: 'half', defaultValue: null },
        { key: 'certkey', label: 'Certificate key', type: 'string', width: 'half', defaultValue: null },
        { key: 'secrets_dir', label: 'Secrets directory', type: 'string', width: 'half', defaultValue: null },
      ],
    },
    {
      id: 'paths',
      label: 'Paths',
      fields: [
        { key: 'images_path', label: 'Images', type: 'string', width: 'half', defaultValue: '~/GNS3/images' },
        { key: 'projects_path', label: 'Projects', type: 'string', width: 'half', defaultValue: '~/GNS3/projects' },
        { key: 'appliances_path', label: 'Appliances', type: 'string', width: 'half', defaultValue: '~/GNS3/appliances' },
        { key: 'symbols_path', label: 'Symbols', type: 'string', width: 'half', defaultValue: '~/GNS3/symbols' },
        { key: 'configs_path', label: 'Configs', type: 'string', width: 'half', defaultValue: '~/GNS3/configs' },
        { key: 'resources_path', label: 'Resources', type: 'string', width: 'half', defaultValue: null },
        { key: 'additional_images_paths', label: 'Additional image paths', type: 'list', defaultValue: [] },
      ],
    },
    {
      id: 'images',
      label: 'Images',
      fields: [
        { key: 'allow_raw_images', label: 'Allow raw images', type: 'boolean', width: 'half', defaultValue: true },
        { key: 'auto_discover_images', label: 'Auto-discover images', type: 'boolean', width: 'half', defaultValue: true },
      ],
    },
    {
      id: 'console',
      label: 'Console and port ranges',
      fields: [
        { key: 'allow_remote_console', label: 'Allow remote consoles', type: 'boolean', defaultValue: false },
        { key: 'console_start_port_range', label: 'Console ports from', type: 'int', width: 'half', defaultValue: 5000, min: PORT_MIN, max: PORT_MAX },
        { key: 'console_end_port_range', label: 'Console ports to', type: 'int', width: 'half', defaultValue: 10000, min: PORT_MIN, max: PORT_MAX },
        { key: 'vnc_console_start_port_range', label: 'VNC console ports from', type: 'int', width: 'half', defaultValue: VNC_PORT_MIN, min: VNC_PORT_MIN, max: PORT_MAX },
        { key: 'vnc_console_end_port_range', label: 'VNC console ports to', type: 'int', width: 'half', defaultValue: 10000, min: VNC_PORT_MIN, max: PORT_MAX },
        { key: 'udp_start_port_range', label: 'UDP ports from', type: 'int', width: 'half', defaultValue: 10000, min: PORT_MIN, max: PORT_MAX },
        { key: 'udp_end_port_range', label: 'UDP ports to', type: 'int', width: 'half', defaultValue: 30000, min: PORT_MIN, max: PORT_MAX },
      ],
    },
    {
      id: 'ubridge',
      label: 'uBridge and marker',
      fields: [
        { key: 'ubridge_path', label: 'uBridge path', type: 'string', width: 'half', defaultValue: 'ubridge' },
        {
          key: 'ubridge_control_transport',
          label: 'uBridge control transport',
          type: 'enum',
          width: 'half',
          defaultValue: 'unix',
          options: [
            { value: 'unix', label: 'Unix socket (recommended)' },
            { value: 'tcp', label: 'TCP (legacy)' },
          ],
        },
        { key: 'marker_listen_host', label: 'Marker listen host', type: 'string', width: 'half', defaultValue: '127.0.0.1' },
        { key: 'marker_listen_port', label: 'Marker listen port', type: 'int', width: 'half', defaultValue: 3070, min: 0, max: PORT_MAX },
      ],
    },
    {
      id: 'compute-auth',
      label: 'Compute authentication',
      fields: [
        { key: 'compute_username', label: 'Compute username', type: 'string', width: 'half', defaultValue: 'gns3' },
        { key: 'compute_password', label: 'Compute password', type: 'secret', width: 'half', defaultValue: '' },
      ],
    },
    {
      id: 'networking',
      label: 'Networking',
      fields: [
        { key: 'allowed_interfaces', label: 'Allowed interfaces', type: 'list', width: 'half', defaultValue: [] },
        { key: 'default_nat_interface', label: 'Default NAT interface', type: 'string', width: 'half', defaultValue: null },
      ],
    },
    {
      id: 'builtin',
      label: 'Builtin content',
      fields: [
        { key: 'enable_builtin_templates', label: 'Enable builtin templates', type: 'boolean', width: 'half', defaultValue: true },
        { key: 'install_builtin_appliances', label: 'Install builtin appliances', type: 'boolean', width: 'half', defaultValue: true },
        {
          key: 'default_symbol_theme',
          label: 'Default symbol theme',
          type: 'enum',
          width: 'half',
          defaultValue: 'Affinity-square-blue',
          options: [
            { value: 'Classic', label: 'Classic' },
            { value: 'Affinity-square-blue', label: 'Affinity square blue' },
            { value: 'Affinity-square-red', label: 'Affinity square red' },
            { value: 'Affinity-square-gray', label: 'Affinity square gray' },
            { value: 'Affinity-circle-blue', label: 'Affinity circle blue' },
            { value: 'Affinity-circle-red', label: 'Affinity circle red' },
            { value: 'Affinity-circle-gray', label: 'Affinity circle gray' },
          ],
        },
      ],
    },
    {
      id: 'skills',
      label: 'Skills repository',
      fields: [
        { key: 'skills_repo_url', label: 'Repository URL', type: 'string', width: 'half', defaultValue: 'https://github.com/gns3/gns3-skills.git' },
        { key: 'skills_repo_branch', label: 'Branch', type: 'string', width: 'half', defaultValue: 'main' },
        { key: 'skills_auto_update', label: 'Auto-update', type: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'mcp',
      label: 'MCP transport security',
      fields: [
        { key: 'mcp_enable_dns_rebinding_protection', label: 'DNS rebinding protection', type: 'boolean', defaultValue: false },
        { key: 'mcp_allowed_hosts', label: 'Allowed hosts', type: 'list', defaultValue: [] },
        { key: 'mcp_allowed_origins', label: 'Allowed origins', type: 'list', defaultValue: [] },
      ],
    },
  ]),
  buildSection('Controller', 'Controller', 'shield', [
    {
      id: 'jwt',
      label: 'JSON Web Tokens',
      fields: [
        { key: 'jwt_algorithm', label: 'Algorithm', type: 'string', width: 'third', defaultValue: 'HS256' },
        { key: 'jwt_access_token_expire_minutes', label: 'Access token expiry (minutes)', type: 'int', width: 'third', defaultValue: 1440, min: 1 },
        { key: 'jwt_refresh_token_expire_minutes', label: 'Refresh token expiry (minutes)', type: 'int', width: 'third', defaultValue: 43200, min: 1 },
      ],
    },
    {
      id: 'default-admin',
      label: 'Default administrator',
      fields: [
        { key: 'default_admin_username', label: 'Username', type: 'string', width: 'half', defaultValue: 'admin' },
        { key: 'default_admin_password', label: 'Password', type: 'secret', width: 'half', defaultValue: 'admin' },
      ],
    },
  ]),
  buildSection('VPCS', 'VPCS', 'terminal', [
    {
      id: 'general',
      label: 'General',
      fields: [{ key: 'vpcs_path', label: 'VPCS path', type: 'string', defaultValue: 'vpcs' }],
    },
  ]),
  buildSection('Dynamips', 'Dynamips', 'memory', [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'dynamips_path', label: 'Dynamips path', type: 'string', defaultValue: 'dynamips' },
        { key: 'allocate_aux_console_ports', label: 'Allocate aux console ports', type: 'boolean', width: 'half', defaultValue: false },
        { key: 'mmap_support', label: 'Memory-mapped I/O support', type: 'boolean', width: 'half', defaultValue: true },
        { key: 'sparse_memory_support', label: 'Sparse memory support', type: 'boolean', width: 'half', defaultValue: true },
        { key: 'ghost_ios_support', label: 'Ghost IOS support', type: 'boolean', width: 'half', defaultValue: true },
      ],
    },
  ]),
  buildSection('IOU', 'IOU', 'lan', [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'iourc_path', label: 'IOURC file', type: 'string', defaultValue: null },
        { key: 'license_check', label: 'License check', type: 'boolean', defaultValue: true },
      ],
    },
  ]),
  buildSection('Qemu', 'Qemu', 'developer_board', [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'enable_monitor', label: 'Enable Qemu monitor', type: 'boolean', defaultValue: true },
        { key: 'monitor_host', label: 'Monitor host', type: 'string', defaultValue: '127.0.0.1' },
      ],
    },
    {
      id: 'advanced',
      label: 'Advanced',
      fields: [
        { key: 'ovmf_firmware_dir', label: 'OVMF firmware directory', type: 'string', defaultValue: '/usr/share/OVMF' },
        { key: 'enable_hardware_acceleration', label: 'Hardware acceleration (KVM/HAXM)', type: 'boolean', width: 'half', defaultValue: true },
        { key: 'require_hardware_acceleration', label: 'Require hardware acceleration', type: 'boolean', width: 'half', defaultValue: false },
        { key: 'allow_unsafe_options', label: 'Allow unsafe options', type: 'boolean', defaultValue: false },
      ],
    },
  ]),
  buildSection('WebWireshark', 'Web Wireshark', 'insights', [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'enabled', label: 'Enabled', type: 'boolean', defaultValue: true },
        { key: 'image', label: 'Container image', type: 'string', width: 'half', defaultValue: 'gns3/web-wireshark:latest' },
        { key: 'network_subnet', label: 'Network subnet', type: 'string', width: 'half', defaultValue: '172.31.0.0/22' },
        { key: 'memory', label: 'Memory limit', type: 'string', width: 'third', defaultValue: '2g' },
        { key: 'cpus', label: 'CPU limit', type: 'float', width: 'third', defaultValue: 1.0, min: 0 },
        { key: 'pids_limit', label: 'PIDs limit', type: 'int', width: 'third', defaultValue: 1000, min: 0 },
      ],
    },
  ]),
];
