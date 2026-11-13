import { Appliance, ApplianceSetting, Version } from '@models/appliance';
import { ApplianceMetadata } from '@models/appliance-metadata';

/**
 * Normalizes v8 appliance format (registry_version 8) into the v1-v6 shape
 * the UI consumes: the default settings group is flattened onto the top-level
 * qemu/docker/iou/dynamips blocks and port-naming fields, so existing install
 * flows work unchanged. v1-v6 appliances pass through untouched.
 *
 * v8 shape:
 *   settings: [{name, default, template_type, template_properties}]
 *   versions[].settings: name of the setting group used by that version
 */
export function normalizeAppliance(appliance: Appliance): Appliance {
  if (!appliance || !Array.isArray(appliance.settings) || appliance.settings.length === 0) {
    return appliance;
  }

  const defaultSetting = getDefaultSetting(appliance);
  if (!defaultSetting) {
    return appliance;
  }

  const props = defaultSetting.template_properties || {};
  const templateType = defaultSetting.template_type;

  // Fill the emulator block the UI reads (qemu/docker/iou/dynamips)
  if (templateType && !(appliance as any)[templateType]) {
    const block: any = { ...props };
    // v6 docker block uses mem_limit for the memory limit
    if (templateType === 'docker' && block.mem_limit === undefined && block.memory !== undefined) {
      block.mem_limit = block.memory;
    }
    (appliance as any)[templateType] = block;
  }

  // Lift port naming and shared fields out of template_properties (v6 keeps them top-level)
  if (appliance.first_port_name === undefined || appliance.first_port_name === null) {
    appliance.first_port_name = props.first_port_name;
  }
  if (appliance.port_name_format === undefined || appliance.port_name_format === null) {
    appliance.port_name_format = props.port_name_format;
  }
  if (appliance.port_segment_size === undefined || appliance.port_segment_size === null) {
    appliance.port_segment_size = props.port_segment_size;
  }
  if (!appliance.custom_adapters && props.custom_adapters) {
    appliance.custom_adapters = props.custom_adapters;
  }
  if (!appliance.usage && props.usage) {
    appliance.usage = props.usage;
  }
  if (!appliance.netmiko_device_type && props.netmiko_device_type) {
    appliance.netmiko_device_type = props.netmiko_device_type;
  }

  return appliance;
}

export function getDefaultSetting(appliance: Appliance): ApplianceSetting | undefined {
  if (!Array.isArray(appliance.settings) || appliance.settings.length === 0) {
    return undefined;
  }
  return appliance.settings.find((s) => s.default) || appliance.settings[0];
}

/**
 * Descriptive appliance fields the server copies onto an installed template.
 * Mirrors _APPLIANCE_METADATA_FIELDS in gns3server/controller/appliance_to_template.py.
 */
const APPLIANCE_METADATA_FIELDS = [
  'description',
  'vendor_name',
  'vendor_url',
  'vendor_logo_url',
  'documentation_url',
  'product_name',
  'product_url',
  'status',
  'availability',
  'maintainer',
  'maintainer_email',
  'installation_instructions',
  'default_username',
  'default_password',
] as const;

/**
 * Builds the appliance_metadata snapshot to attach to a template created
 * client-side from an appliance: version-level values (e.g. credentials
 * specific to the installed version) override appliance-level ones, unset
 * fields are omitted, and appliance_id identifies the source appliance.
 * Mirrors the server's _build_appliance_metadata so templates installed via
 * the web UI carry the same metadata as server-side installs.
 */
export function buildApplianceMetadata(appliance: Appliance, version?: Version | null): ApplianceMetadata | null {
  const metadata: { [key: string]: unknown } = {};
  const versionFields = version as unknown as { [key: string]: unknown } | null | undefined;
  const applianceFields = appliance as unknown as { [key: string]: unknown };
  for (const field of APPLIANCE_METADATA_FIELDS) {
    const value = versionFields?.[field] ?? applianceFields[field];
    if (value !== undefined && value !== null && value !== '') {
      metadata[field] = value;
    }
  }
  if (applianceFields.appliance_id) {
    metadata.appliance_id = applianceFields.appliance_id;
  }
  return Object.keys(metadata).length > 0 ? (metadata as ApplianceMetadata) : null;
}

/**
 * Returns the effective template properties for a version: the default
 * setting group's properties overridden by the setting group(s) the version
 * references (v8 only; returns null for v1-v6 appliances).
 *
 * Mirrors the server's _select_v8_settings + _merge_v8_properties
 * (gns3server/controller/appliance_to_template.py): versions reference a
 * settings group by name as a single string, and a non-default group inherits
 * the default group's properties unless inherit_default_properties is false.
 */
export function getVersionSettingProperties(appliance: Appliance, version: Version): { [key: string]: any } | null {
  const defaultSetting = getDefaultSetting(appliance);
  if (!defaultSetting) {
    return null;
  }

  const settingsRef = version?.settings;
  const groupNames = typeof settingsRef === 'string' ? [settingsRef] : Array.isArray(settingsRef) ? settingsRef : [];
  if (groupNames.length === 0) {
    return null;
  }

  const groups = groupNames
    .map((name) => appliance.settings.find((s) => s.name === name))
    .filter((s): s is ApplianceSetting => !!s);
  if (groups.length === 0) {
    // The server raises here; fall back to the default group at the caller so
    // the install still produces a usable template instead of a broken one.
    return null;
  }

  const merged: { [key: string]: any } = {};
  if (groups.every((group) => group.inherit_default_properties !== false)) {
    Object.assign(merged, defaultSetting.template_properties || {});
  }
  for (const group of groups) {
    Object.assign(merged, group.template_properties || {});
  }
  return merged;
}

/**
 * Converts the appliance-only qemu keys and returns the properties as they
 * must land on a template: `kvm: "disable"` becomes a `-machine accel=tcg`
 * qemu option, `arch` is renamed `platform`, and `path` plus the structural
 * fields are dropped. Everything else (uefi, tpm, options, cpu settings...)
 * passes through untouched.
 *
 * Mirrors gns3server/controller/appliance_to_template.py: the kvm conversion
 * and reserved pops in _add_qemu_config (registry versions 1-6) and
 * _new_template_v8 (registry version 8).
 */
export function normalizeQemuProperties(props: { [key: string]: any }): { [key: string]: any } {
  const normalized = { ...props };

  // kvm is not a valid template property: convert it to the equivalent qemu
  // option like the server does
  const kvm = normalized.kvm ?? 'allow';
  delete normalized.kvm;
  let options = normalized.options || '';
  if (kvm === 'disable' && !options.includes('-machine accel=tcg')) {
    options += ' -machine accel=tcg';
  }
  normalized.options = options.trim();

  // v1-v6 qemu blocks call it `arch`; templates use `platform`
  if (normalized.platform === undefined && normalized.arch !== undefined) {
    normalized.platform = normalized.arch;
  }
  delete normalized.arch;

  // not valid on a template
  delete normalized.path;
  delete normalized.template_type;
  delete normalized.compute_id;
  delete normalized.version;

  return normalized;
}
