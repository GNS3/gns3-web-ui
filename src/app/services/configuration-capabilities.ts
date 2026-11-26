import { Node } from '../cartography/models/node';
import { startupMediaProfileDeviceType, StartupProfileLookup } from '@models/startup-media-profile';

/**
 * Single source of truth for "what can the configuration features do with this
 * node". Every surface (context menu, nodes menu, set dialog, node tab, services)
 * asks this module instead of keeping its own node-type list.
 */

const CONFIGURATION_EXPORT_DRIVERS = [
  'cisco_ios_telnet',
  'cisco_nxos',
  'cisco_asa',
  'cisco_xr',
  'cisco_viptela',
  'mikrotik_routeros',
  'paloalto_panos',
  'arista_eos',
  'juniper_junos',
] as const;

export type ConfigurationExportDeviceType = (typeof CONFIGURATION_EXPORT_DRIVERS)[number];

/** Recipes that only capture: their startup is delivered as boot media, never replayed through the console. */
const CAPTURE_ONLY_DRIVERS: ReadonlySet<string> = new Set([
  'cisco_viptela',
  'paloalto_panos',
  'arista_eos',
  'juniper_junos',
]);

export function isCaptureOnlyDriver(driver?: string | null): boolean {
  return !!driver && CAPTURE_ONLY_DRIVERS.has(driver);
}

export function configurationExportDriver(value?: string): ConfigurationExportDeviceType | undefined {
  // Mirrors the server's normalize_device_type: ASAv and Catalyst 8000v/CSR reuse the ASA and IOS recipes.
  const aliases = {
    cisco_ios: 'cisco_ios_telnet',
    cisco_xe: 'cisco_ios_telnet',
    cisco_xe_ssh: 'cisco_ios_telnet',
    cisco_xe_telnet: 'cisco_ios_telnet',
    cisco_asa_ssh: 'cisco_asa',
  };
  const canonical = aliases[value] || value?.replace(/_telnet$/, '');
  return CONFIGURATION_EXPORT_DRIVERS.find((driver) => driver === value || driver === canonical);
}

export type StartupDeviceType = ConfigurationExportDeviceType | 'linux_interfaces' | 'frr' | 'vpcs';

/** Node types the server's configuration engines know about. */
const STARTUP_NODE_TYPES: ReadonlySet<string> = new Set(['dynamips', 'iou', 'qemu', 'docker', 'vpcs']);
/** Node types whose startup file can be written directly through the node-files API. */
const NODE_FILE_IMPORT_TYPES: ReadonlySet<string> = new Set(['vpcs', 'iou', 'dynamips']);

const IOL_RUNNER_LINE = /^\s*GNS3_IOL_RUNNER=(.*)$/;

/**
 * The only parser of the `GNS3_IOL_RUNNER=` environment line. Returns the
 * runner value, or undefined when the node is not a Docker IOL appliance.
 */
export function dockerIolRunner(node: Node | undefined): string | undefined {
  if (node?.node_type !== 'docker' || node.console_type === 'docker_exec') return undefined;
  const environment = node.properties?.environment;
  if (typeof environment !== 'string') return undefined;
  for (const line of environment.split(/\r?\n/)) {
    const marker = line.trim().replace(/,+$/, '');
    if (marker.startsWith('GNS3_UNIX_SOCKET_NIO=')) return undefined;
    const match = IOL_RUNNER_LINE.exec(marker);
    if (match) return match[1].trim();
  }
  return undefined;
}

export function isDockerIol(node: Node | undefined): boolean {
  return dockerIolRunner(node) !== undefined;
}

/**
 * True for an FRRouting container: an image repository named `frr`, or the GNS3 FRR image's `FRR_PROFILE`
 * setting. Mirrors the server's `is_frr_node`; vendor and IOL containers are never one, and a declared
 * Netmiko device type takes precedence.
 */
export function isDockerFrr(node: Node | undefined): boolean {
  if (node?.node_type !== 'docker' || node.console_type === 'docker_exec' || node.netmiko_device_type) return false;
  const environment = typeof node.properties?.environment === 'string' ? node.properties.environment : '';
  const lines = environment.split(/\r?\n/).map((line) => line.trim());
  if (lines.some((line) => line.startsWith('GNS3_IOL_RUNNER=') || line.startsWith('GNS3_UNIX_SOCKET_NIO='))) {
    return false;
  }
  const image = typeof node.properties?.image === 'string' ? node.properties.image : '';
  const repository = image.split('@')[0].split('/').pop().split(':')[0];
  return repository === 'frr' || lines.some((line) => line.startsWith('FRR_PROFILE='));
}

/**
 * True when a boot media profile of this device type can be used on a node of the given Netmiko device type.
 * A node without a device type accepts every profile; one with a device type only its own appliance's profiles
 * (a Viptela profile on a Catalyst 8000v would deliver a configuration the guest cannot read).
 */
export function startupMediaProfileFitsDevice(profileDeviceType: string, netmikoDeviceType?: string | null): boolean {
  const recipe = configurationExportDriver(netmikoDeviceType || undefined);
  return !netmikoDeviceType?.trim() || recipe === profileDeviceType;
}

/** The startup media profile selected on a QEMU node ('' and null mean none). */
export function startupMediaProfileId(node: Node | undefined): string | undefined {
  if (node?.node_type !== 'qemu') return undefined;
  const profile = node.properties?.startup_media_profile;
  return typeof profile === 'string' && profile.trim() ? profile.trim() : undefined;
}

/**
 * The device type of the node's startup entry. A QEMU node with a boot media
 * profile uses the profile's type; otherwise it is the node's console recipe.
 */
export function startupDeviceType(node: Node, lookup?: StartupProfileLookup): StartupDeviceType | undefined {
  const profileType = startupMediaProfileDeviceType(startupMediaProfileId(node), lookup);
  if (profileType) return profileType as StartupDeviceType;
  if (['dynamips', 'iou'].includes(node?.node_type)) return 'cisco_ios_telnet';
  if (node?.node_type === 'vpcs') return 'vpcs';
  if (isDockerIol(node)) return 'cisco_ios_telnet';
  if (isDockerFrr(node)) return 'frr';
  const driver = configurationExportDriver(node?.netmiko_device_type);
  return driver || (node?.node_type === 'docker' ? 'linux_interfaces' : undefined);
}

/** Docker nodes the server can wipe and start from a saved configuration: the network file or IOL. */
function dockerHasNativeStartup(node: Node): boolean {
  return isDockerIol(node) || ['', 'linux', 'linux_telnet'].includes(node.netmiko_device_type || '');
}

/** Why a saved configuration cannot be started on this node (server codes), if it cannot. */
export type StartupBlocker =
  | 'device_type_required'
  | 'device_type_unsupported'
  | 'configuration_profile_mismatch'
  | 'configuration_apply_unsupported'
  | 'configuration_restore_console_required'
  | 'configuration_wipe_unsupported';

/**
 * Mirrors the server's start/wipe checks. A QEMU node with a startup media
 * profile receives the text as boot media: it needs no Netmiko device type and
 * no Telnet or SSH console, only an entry of the profile's device type. Without
 * a profile the text is replayed through the console, so the node needs a
 * console recipe from its Netmiko device type, an entry of the same type and a
 * Telnet or SSH console; Viptela cannot be replayed (only delivered as media).
 * Docker nodes other than the network file and IOL cannot be wiped or restored.
 */
export function startupBlocker(
  node: Node | undefined,
  entry?: { device_type?: string | null },
  lookup?: StartupProfileLookup,
): StartupBlocker | undefined {
  if (node?.node_type === 'docker') return dockerHasNativeStartup(node) ? undefined : 'configuration_wipe_unsupported';
  if (node?.node_type !== 'qemu') return undefined;
  const profile = startupMediaProfileId(node);
  if (profile) {
    const required = startupMediaProfileDeviceType(profile, lookup);
    return required &&
      (!startupMediaProfileFitsDevice(required, node.netmiko_device_type) ||
        (entry?.device_type && entry.device_type !== required))
      ? 'configuration_profile_mismatch'
      : undefined;
  }
  const declared = node.netmiko_device_type || '';
  const recipe = configurationExportDriver(declared);
  if (!recipe) return declared ? 'device_type_unsupported' : 'device_type_required';
  if (isCaptureOnlyDriver(recipe)) return 'configuration_apply_unsupported';
  if (entry?.device_type && entry.device_type !== recipe) return 'configuration_profile_mismatch';
  // An unknown console type is not a refusal; a graphical or absent console is.
  return !node.console_type || ['telnet', 'ssh'].includes(node.console_type)
    ? undefined
    : 'configuration_restore_console_required';
}

/** A start that works but leaves the device open, worth saying before it happens; '' when there is none. */
export function startupWarning(entry?: { device_type?: string | null; content?: string } | null): string {
  return entry?.device_type === 'juniper_junos' &&
    entry.content?.trim() &&
    !/\broot-authentication\b/.test(entry.content)
    ? 'This configuration sets no root password: after the restore, root logs in without one.'
    : '';
}

/** True when "Export config" reads the running console, which needs console access on top of audit access. */
export function exportReadsConsole(node: Node | undefined): boolean {
  // IOU and Dynamips download their saved files; a running FRR container is read with a command in it.
  return node?.node_type === 'qemu' || (isDockerFrr(node) && node.status === 'started');
}

function captureAvailability(
  node: Node | undefined,
  deviceType: StartupDeviceType | undefined,
): 'ready' | 'start_required' | 'unavailable' {
  if (['vpcs', 'linux_interfaces', 'frr'].includes(deviceType)) return 'ready';
  // Export reads the running console, so a QEMU node needs its own Netmiko recipe even with a boot media profile.
  if (
    !node ||
    !configurationExportDriver(deviceType) ||
    (node.node_type === 'qemu' && !configurationExportDriver(node.netmiko_device_type))
  ) {
    return 'unavailable';
  }
  return node.status === 'started' ? 'ready' : 'start_required';
}

export function canCaptureConfiguration(node: Node | undefined, deviceType: StartupDeviceType): boolean {
  return captureAvailability(node, deviceType) === 'ready';
}

interface NodeConfigCapabilities {
  /** The node type has a configuration engine at all; such a node offers the "Export config" download. */
  supported: boolean;
  /** Context-menu file import (writes the node's own startup file). */
  canImport: boolean;
  /** Wipe is offered in any state (the server stops a running node first), except for unsupported Docker nodes. */
  canWipe: boolean;
  /** The node's configuration can be captured into a set right now. */
  canCapture: boolean;
  /** The node has a capture source but must be running first. */
  captureRequiresStart: boolean;
}

export function nodeConfigCapabilities(node: Node | undefined): NodeConfigCapabilities {
  const supported = !!node && STARTUP_NODE_TYPES.has(node.node_type);
  const deviceType = supported ? startupDeviceType(node) : undefined;
  const capture = captureAvailability(node, deviceType);
  // Startup and wipe share one rule: only Docker nodes without a native startup are refused.
  const startable = supported && (node.node_type !== 'docker' || !startupBlocker(node));
  return {
    supported,
    canImport: supported && NODE_FILE_IMPORT_TYPES.has(node.node_type),
    canWipe: startable,
    canCapture: capture === 'ready',
    captureRequiresStart: capture === 'start_required',
  };
}

/** Nodes in `nodes` that a project-wide wipe may touch (any state). */
export function wipeableNodes(nodes: Node[]): Node[] {
  return (nodes || []).filter((node) => nodeConfigCapabilities(node).canWipe);
}
