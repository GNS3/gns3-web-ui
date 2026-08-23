import { describe, it, expect } from 'vitest';
import { arraysEqual, buildSettingsUpdate, collectDirtyKeys, valuesEqual } from './settings-diff';
import { SETTINGS_METADATA, RESTART_REQUIRED } from '@models/server-settings/settings-metadata';
import { ServerSettings } from '@models/server-settings/server-settings';

// A minimal but complete ServerSettings fixture: every section present, values
// mirroring the server defaults so unchanged comparisons are predictable.
function baseSettings(): ServerSettings {
  return {
    Server: {
      local: false,
      enable_http_auth: true,
      name: 'myhost (controller)',
      protocol: 'http',
      host: '0.0.0.0',
      port: 3080,
      secrets_dir: null,
      certfile: null,
      certkey: null,
      enable_ssl: false,
      images_path: '~/GNS3/images',
      projects_path: '~/GNS3/projects',
      appliances_path: '~/GNS3/appliances',
      symbols_path: '~/GNS3/symbols',
      configs_path: '~/GNS3/configs',
      resources_path: null,
      default_symbol_theme: 'Affinity-square-blue',
      allow_raw_images: true,
      auto_discover_images: true,
      report_errors: true,
      additional_images_paths: [],
      console_start_port_range: 5000,
      console_end_port_range: 10000,
      vnc_console_start_port_range: 5900,
      vnc_console_end_port_range: 10000,
      udp_start_port_range: 10000,
      udp_end_port_range: 30000,
      ubridge_path: 'ubridge',
      ubridge_control_transport: 'unix',
      marker_listen_host: '127.0.0.1',
      marker_listen_port: 3070,
      compute_username: 'gns3',
      compute_password: '**********',
      allowed_interfaces: [],
      default_nat_interface: null,
      allow_remote_console: false,
      enable_builtin_templates: true,
      install_builtin_appliances: true,
      skills_repo_url: 'https://github.com/gns3/gns3-skills.git',
      skills_repo_branch: 'main',
      skills_auto_update: true,
      mcp_enable_dns_rebinding_protection: false,
      mcp_allowed_hosts: [],
      mcp_allowed_origins: [],
    },
    Controller: {
      jwt_algorithm: 'HS256',
      jwt_access_token_expire_minutes: 1440,
      jwt_refresh_token_expire_minutes: 43200,
      default_admin_username: 'admin',
      default_admin_password: '**********',
    },
    VPCS: { vpcs_path: 'vpcs' },
    Dynamips: {
      allocate_aux_console_ports: false,
      mmap_support: true,
      dynamips_path: 'dynamips',
      sparse_memory_support: true,
      ghost_ios_support: true,
    },
    IOU: { iourc_path: null, license_check: true },
    Qemu: {
      enable_monitor: true,
      monitor_host: '127.0.0.1',
      enable_hardware_acceleration: true,
      require_hardware_acceleration: false,
      allow_unsafe_options: false,
      ovmf_firmware_dir: '/usr/share/OVMF',
    },
    WebWireshark: {
      enabled: true,
      image: 'gns3/web-wireshark:latest',
      network_subnet: '172.31.0.0/22',
      memory: '2g',
      cpus: 1.0,
      pids_limit: 1000,
    },
  };
}

describe('arraysEqual / valuesEqual', () => {
  it('should compare arrays element-wise', () => {
    expect(arraysEqual(['eth0', 'lo'], ['eth0', 'lo'])).toBe(true);
    expect(arraysEqual(['eth0'], ['eth0', 'lo'])).toBe(false);
    expect(arraysEqual(['lo', 'eth0'], ['eth0', 'lo'])).toBe(false);
  });

  it('should compare scalars and arrays through valuesEqual', () => {
    expect(valuesEqual(3080, 3080)).toBe(true);
    expect(valuesEqual('a', 'b')).toBe(false);
    expect(valuesEqual(null, null)).toBe(true);
    expect(valuesEqual([], [])).toBe(true);
    expect(valuesEqual(['a'], ['a', 'b'])).toBe(false);
  });
});

describe('collectDirtyKeys', () => {
  it('should report nothing for an untouched form', () => {
    const initial = baseSettings();
    const dirty = collectDirtyKeys(SETTINGS_METADATA, initial, initial, new Set(), {});
    expect(dirty.size).toBe(0);
  });

  it('should report changed values, pending removes and secret states', () => {
    const initial = baseSettings();
    const current = { ...initial, Server: { ...initial.Server, report_errors: false } };
    const dirty = collectDirtyKeys(
      SETTINGS_METADATA,
      initial,
      current,
      new Set(['Dynamips.mmap_support']),
      { 'Controller.default_admin_password': { state: 'clear' } }
    );
    expect(dirty.has('Server.report_errors')).toBe(true);
    expect(dirty.has('Dynamips.mmap_support')).toBe(true);
    expect(dirty.has('Controller.default_admin_password')).toBe(true);
    expect(dirty.size).toBe(3);
  });

  it('should treat unchanged secrets as clean', () => {
    const initial = baseSettings();
    const dirty = collectDirtyKeys(SETTINGS_METADATA, initial, initial, new Set(), {
      'Server.compute_password': { state: 'unchanged' },
    });
    expect(dirty.size).toBe(0);
  });
});

describe('buildSettingsUpdate', () => {
  it('should return an empty payload when nothing changed', () => {
    const initial = baseSettings();
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, initial, new Set(), {});
    expect(update).toEqual({});
  });

  it('should submit only changed options grouped per section', () => {
    const initial = baseSettings();
    const current = {
      ...initial,
      Server: { ...initial.Server, report_errors: false, host: '127.0.0.1' },
      Qemu: { ...initial.Qemu, enable_monitor: false },
    };
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, current, new Set(), {});
    expect(update).toEqual({
      Server: { report_errors: false, host: '127.0.0.1' },
      Qemu: { enable_monitor: false },
    });
  });

  it('should send null for pending removes (revert to default)', () => {
    const initial = { ...baseSettings(), Server: { ...baseSettings().Server, host: '127.0.0.1' } };
    const current = { ...initial, Server: { ...initial.Server, host: '0.0.0.0' } };
    const update = buildSettingsUpdate(
      SETTINGS_METADATA,
      initial,
      current,
      new Set(['Server.host']),
      {}
    );
    expect(update.Server?.host).toBeNull();
  });

  it('should submit the edited value again once a reverted field is re-edited', () => {
    const initial = { ...baseSettings(), Server: { ...baseSettings().Server, host: '127.0.0.1' } };
    const current = { ...initial, Server: { ...initial.Server, host: '192.168.1.10' } };
    // The user reverted, then edited again: the pending remove is cleared and
    // the normal value diff applies.
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, current, new Set(), {});
    expect(update.Server?.host).toBe('192.168.1.10');
  });

  it('should apply secret three-state semantics', () => {
    const initial = baseSettings();
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, initial, new Set(), {
      'Server.compute_password': { state: 'set', value: 'new-secret' },
      'Controller.default_admin_password': { state: 'clear' },
    });
    expect(update.Server?.compute_password).toBe('new-secret');
    expect(update.Controller?.default_admin_password).toBeNull();
  });

  it('should omit secrets in the unchanged state', () => {
    const initial = baseSettings();
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, initial, new Set(), {
      'Server.compute_password': { state: 'unchanged' },
    });
    expect(update.Server).toBeUndefined();
  });

  it('should coerce and clamp numeric values', () => {
    const initial = baseSettings();
    const current = { ...initial, Server: { ...initial.Server, port: 99999 as number, marker_listen_port: -5 as number } };
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, current, new Set(), {});
    expect(update.Server?.port).toBe(65535);
    expect(update.Server?.marker_listen_port).toBe(0);
  });

  it('should submit changed lists as arrays', () => {
    const initial = baseSettings();
    const current = { ...initial, Server: { ...initial.Server, allowed_interfaces: ['eth0', 'lo'] } };
    const update = buildSettingsUpdate(SETTINGS_METADATA, initial, current, new Set(), {});
    expect(update.Server?.allowed_interfaces).toEqual(['eth0', 'lo']);
  });
});

describe('SETTINGS_METADATA integrity', () => {
  it('should have unique field keys within each section', () => {
    for (const section of SETTINGS_METADATA) {
      const keys = section.groups.flatMap((group) => group.fields.map((field) => field.key));
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('should map every RESTART_REQUIRED option to a metadata field', () => {
    const known = new Set<string>();
    for (const section of SETTINGS_METADATA) {
      for (const field of section.groups.flatMap((group) => group.fields)) {
        known.add(`${section.name}.${field.key}`);
      }
    }
    for (const option of RESTART_REQUIRED) {
      expect(known.has(option)).toBe(true);
    }
  });

  it('should flag exactly the RESTART_REQUIRED fields as restartRequired', () => {
    for (const section of SETTINGS_METADATA) {
      for (const field of section.groups.flatMap((group) => group.fields)) {
        expect(field.restartRequired).toBe(RESTART_REQUIRED.has(`${section.name}.${field.key}`));
      }
    }
  });

  it('should provide options for every enum field and cover 69 writable fields', () => {
    let count = 0;
    for (const section of SETTINGS_METADATA) {
      for (const field of section.groups.flatMap((group) => group.fields)) {
        count++;
        if (field.type === 'enum') {
          expect(field.options?.length).toBeGreaterThan(0);
          expect(field.options?.some((option) => option.value === field.defaultValue)).toBe(true);
        }
      }
    }
    expect(count).toBe(69);
  });
});
