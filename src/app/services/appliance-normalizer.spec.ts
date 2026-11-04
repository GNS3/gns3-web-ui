import { describe, it, expect } from 'vitest';
import { Appliance } from '@models/appliance';
import {
  normalizeAppliance,
  getDefaultSetting,
  getVersionSettingProperties,
  buildApplianceMetadata,
  normalizeQemuProperties,
  getDefaultApplianceSymbol,
} from './appliance-normalizer';

function createV8Appliance(): Appliance {
  return {
    name: 'v8 appliance',
    category: 'router',
    registry_version: 8,
    vendor_name: 'Vendor',
    status: 'stable',
    versions: [
      {
        name: '1.0',
        images: { hda_disk_image: 'v8-1.0.qcow2' },
        settings: ['small'],
        category: 'guest',
        usage: 'version usage',
        symbol: ':/symbols/custom.svg',
      },
      {
        name: '2.0',
        images: { hda_disk_image: 'v8-2.0.qcow2' },
      },
    ],
    settings: [
      {
        name: 'default',
        default: true,
        template_type: 'qemu',
        template_properties: {
          ram: 4096,
          adapters: 8,
          console_type: 'telnet',
          arch: 'x86_64',
          first_port_name: 'eth1',
          port_name_format: 'eth{0}',
          port_segment_size: 3,
        },
      },
      {
        name: 'small',
        template_type: 'qemu',
        template_properties: {
          ram: 2048,
          adapters: 4,
        },
      },
    ],
  } as unknown as Appliance;
}

describe('appliance-normalizer', () => {
  describe('normalizeAppliance', () => {
    it('should return v6 appliance untouched', () => {
      const appliance = {
        name: 'v6 appliance',
        registry_version: 6,
        qemu: { ram: 1024, adapters: 2, console_type: 'telnet' },
      } as unknown as Appliance;

      const result = normalizeAppliance(appliance);

      expect(result).toBe(appliance);
      expect(result.qemu.ram).toBe(1024);
    });

    it('should fill qemu block from default settings group', () => {
      const appliance = createV8Appliance();

      const result = normalizeAppliance(appliance);

      expect(result.qemu).toBeDefined();
      expect(result.qemu.ram).toBe(4096);
      expect(result.qemu.adapters).toBe(8);
      expect(result.qemu.console_type).toBe('telnet');
    });

    it('should lift port naming fields from template_properties', () => {
      const appliance = createV8Appliance();

      const result = normalizeAppliance(appliance);

      expect(result.first_port_name).toBe('eth1');
      expect(result.port_name_format).toBe('eth{0}');
      expect(result.port_segment_size).toBe(3);
    });

    it('should keep top-level port naming fields when already set', () => {
      const appliance = createV8Appliance();
      appliance.first_port_name = 'Gi1';

      const result = normalizeAppliance(appliance);

      expect(result.first_port_name).toBe('Gi1');
    });

    it('should map docker memory to mem_limit', () => {
      const appliance = createV8Appliance();
      appliance.settings = [
        {
          name: 'default',
          default: true,
          template_type: 'docker',
          template_properties: {
            adapters: 16,
            console_type: 'docker_exec',
            image: 'vendor/router:latest',
            memory: 4096,
          },
        },
      ];

      const result = normalizeAppliance(appliance);

      expect(result.docker).toBeDefined();
      expect(result.docker.mem_limit).toBe(4096);
      expect(result.docker.image).toBe('vendor/router:latest');
    });

    it('should use first settings group when no group is marked default', () => {
      const appliance = createV8Appliance();
      appliance.settings[0].default = undefined;

      const result = normalizeAppliance(appliance);

      expect(result.qemu.ram).toBe(4096);
    });

    it('should carry netmiko_device_type from template_properties', () => {
      const appliance = createV8Appliance();
      appliance.settings[0].template_properties.netmiko_device_type = 'cisco_xr';

      const result = normalizeAppliance(appliance);

      expect(result.netmiko_device_type).toBe('cisco_xr');
    });
  });

  describe('getDefaultSetting', () => {
    it('should return undefined for v6 appliance without settings', () => {
      expect(getDefaultSetting({ registry_version: 6 } as unknown as Appliance)).toBeUndefined();
    });

    it('should return the group marked default', () => {
      const appliance = createV8Appliance();

      expect(getDefaultSetting(appliance)?.name).toBe('default');
    });
  });

  describe('getVersionSettingProperties', () => {
    it('should return null when version has no settings', () => {
      const appliance = createV8Appliance();

      expect(getVersionSettingProperties(appliance, appliance.versions[1])).toBeNull();
    });

    it('should resolve a settings group referenced by name as a string', () => {
      const appliance = createV8Appliance();
      // real server data (e.g. vyos.gns3a) references a group by name as a single string
      appliance.versions[0].settings = 'small';

      const props = getVersionSettingProperties(appliance, appliance.versions[0]);

      expect(props).not.toBeNull();
      expect(props['ram']).toBe(2048);
      expect(props['adapters']).toBe(4);
    });

    it('should merge version setting group over default properties', () => {
      const appliance = createV8Appliance();

      const props = getVersionSettingProperties(appliance, appliance.versions[0]);

      expect(props).not.toBeNull();
      expect(props['ram']).toBe(2048); // overridden by 'small' group
      expect(props['adapters']).toBe(4); // overridden by 'small' group
      expect(props['console_type']).toBe('telnet'); // kept from default group
    });

    it('should not inherit default properties when inherit_default_properties is false', () => {
      const appliance = createV8Appliance();
      appliance.settings[1].inherit_default_properties = false;

      const props = getVersionSettingProperties(appliance, appliance.versions[0]);

      expect(props).not.toBeNull();
      expect(props['ram']).toBe(2048);
      expect(props['console_type']).toBeUndefined(); // default group not merged
    });

    it('should return null for unknown group name (caller falls back to default block)', () => {
      const appliance = createV8Appliance();
      appliance.versions[0].settings = 'missing-group';

      expect(getVersionSettingProperties(appliance, appliance.versions[0])).toBeNull();
    });

    it('should return null for v6 appliance without settings', () => {
      const appliance = { registry_version: 6 } as unknown as Appliance;

      expect(getVersionSettingProperties(appliance, { name: '1.0', images: {} } as any)).toBeNull();
    });
  });

  describe('buildApplianceMetadata', () => {
    it('should snapshot appliance-level fields and appliance_id', () => {
      const appliance = createV8Appliance();
      appliance.appliance_id = 'f82b74c4-0f30-456f-a582-63daca528502';
      appliance.default_username = 'vyos';
      appliance.default_password = 'vyos';
      appliance.installation_instructions = 'Import the qcow2 image.';

      const metadata = buildApplianceMetadata(appliance)!;

      expect(metadata['default_username']).toBe('vyos');
      expect(metadata['default_password']).toBe('vyos');
      expect(metadata['installation_instructions']).toBe('Import the qcow2 image.');
      expect(metadata['vendor_name']).toBe('Vendor');
      expect(metadata['status']).toBe('stable');
      expect(metadata['appliance_id']).toBe('f82b74c4-0f30-456f-a582-63daca528502');
    });

    it('should let version-level values override appliance-level ones', () => {
      const appliance = createV8Appliance();
      appliance.default_username = 'appliance-user';
      appliance.versions[0].default_username = 'version-user';
      appliance.versions[0].installation_instructions = 'version-specific instructions';

      const metadata = buildApplianceMetadata(appliance, appliance.versions[0])!;

      expect(metadata['default_username']).toBe('version-user');
      expect(metadata['installation_instructions']).toBe('version-specific instructions');
    });

    it('should fall back to the appliance level when the version does not define a field', () => {
      const appliance = createV8Appliance();
      appliance.default_username = 'appliance-user';

      const metadata = buildApplianceMetadata(appliance, appliance.versions[0])!;

      expect(metadata['default_username']).toBe('appliance-user');
    });

    it('should omit unset, null and empty-string fields', () => {
      const appliance = createV8Appliance();

      const metadata = buildApplianceMetadata(appliance)!;

      expect(metadata['default_username']).toBeUndefined();
      expect(metadata['documentation_url']).toBeUndefined();
      expect(metadata['maintainer_email']).toBeUndefined();
      // only the fields the fixture actually defines are present
      expect(Object.keys(metadata).sort()).toEqual(['status', 'vendor_name']);
    });

    it('should return null when nothing is set', () => {
      const appliance = { name: 'bare', registry_version: 8 } as unknown as Appliance;

      expect(buildApplianceMetadata(appliance)).toBeNull();
      expect(buildApplianceMetadata(appliance, { name: '1.0', images: {} } as any)).toBeNull();
    });
  });

  describe('normalizeQemuProperties', () => {
    it('should pass template properties through untouched', () => {
      const props = {
        ram: 1024,
        adapters: 1,
        adapter_type: 'virtio-net-pci',
        console_type: 'telnet',
        boot_priority: 'c',
        hda_disk_interface: 'virtio',
        options: '-nographic',
        uefi: true,
        tpm: false,
        platform: 'aarch64',
      };

      const normalized = normalizeQemuProperties(props);

      expect(normalized).toEqual(props);
    });

    it('should not mutate the input properties', () => {
      const props = { kvm: 'disable', arch: 'x86_64', ram: 512 };

      normalizeQemuProperties(props);

      expect(props).toEqual({ kvm: 'disable', arch: 'x86_64', ram: 512 });
    });

    it('should convert kvm disable into a tcg qemu option', () => {
      const normalized = normalizeQemuProperties({ kvm: 'disable', options: '-nographic' });

      expect(normalized.kvm).toBeUndefined();
      expect(normalized.options).toBe('-nographic -machine accel=tcg');
    });

    it('should not duplicate the tcg option when already present', () => {
      const normalized = normalizeQemuProperties({ kvm: 'disable', options: '-machine accel=tcg' });

      expect(normalized.options).toBe('-machine accel=tcg');
    });

    it('should keep options untouched when kvm is allowed', () => {
      expect(normalizeQemuProperties({ kvm: 'allow', options: '-nographic' }).options).toBe('-nographic');
      expect(normalizeQemuProperties({ kvm: 'require', options: '-nographic' }).options).toBe('-nographic');
    });

    it('should default options to an empty string', () => {
      expect(normalizeQemuProperties({ ram: 512 }).options).toBe('');
      expect(normalizeQemuProperties({ options: '  -nographic  ' }).options).toBe('-nographic');
    });

    it('should rename arch to platform when platform is not set', () => {
      const normalized = normalizeQemuProperties({ arch: 'x86_64', ram: 512 });

      expect(normalized.platform).toBe('x86_64');
      expect(normalized.arch).toBeUndefined();
    });

    it('should prefer an explicit platform over arch', () => {
      const normalized = normalizeQemuProperties({ arch: 'x86_64', platform: 'aarch64' });

      expect(normalized.platform).toBe('aarch64');
      expect(normalized.arch).toBeUndefined();
    });

    it('should drop properties that are not valid on a template', () => {
      const normalized = normalizeQemuProperties({
        ram: 512,
        path: '/usr/bin/qemu-system-x86_64',
        template_type: 'qemu',
        compute_id: 'local',
        version: '1.0',
      });

      expect(normalized.ram).toBe(512);
      expect(normalized.path).toBeUndefined();
      expect(normalized.template_type).toBeUndefined();
      expect(normalized.compute_id).toBeUndefined();
      expect(normalized.version).toBeUndefined();
    });
  });

  describe('getDefaultApplianceSymbol', () => {
    it('should return the guest symbols based on the template type', () => {
      expect(getDefaultApplianceSymbol('guest', 'qemu')).toBe(':/symbols/qemu_guest.svg');
      expect(getDefaultApplianceSymbol('guest', 'docker')).toBe(':/symbols/docker_guest.svg');
    });

    it('should map the non-guest categories', () => {
      expect(getDefaultApplianceSymbol('router', 'qemu')).toBe(':/symbols/router.svg');
      expect(getDefaultApplianceSymbol('switch', 'qemu')).toBe(':/symbols/ethernet_switch.svg');
      expect(getDefaultApplianceSymbol('multilayer_switch', 'qemu')).toBe(':/symbols/multilayer_switch.svg');
      expect(getDefaultApplianceSymbol('firewall', 'qemu')).toBe(':/symbols/firewall.svg');
    });

    it('should return undefined for an unknown or missing category', () => {
      expect(getDefaultApplianceSymbol(undefined, 'qemu')).toBeUndefined();
      expect(getDefaultApplianceSymbol('unknown', 'qemu')).toBeUndefined();
    });
  });
});
