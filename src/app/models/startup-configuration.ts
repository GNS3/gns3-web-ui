import { StartupProfileLookup } from './startup-media-profile';
import { Node } from '../cartography/models/node';
import { StartupDeviceType, startupBlocker } from '@services/configuration-capabilities';

/** Server-owned set that must always exist and cannot be renamed or deleted. */
export const STARTUP_DEFAULT_SET_ID = '00000000-0000-0000-0000-000000000000';
/** The server rejects a single saved configuration above this size. */
const MAX_CONFIGURATION_BYTES = 2 * 1024 * 1024;
/** Largest set archive the server accepts (24 MiB). */
export const MAX_SET_ARCHIVE_BYTES = 24 * 1024 * 1024;
export const MAX_CONFIGURATION_SETS = 32;

export interface StartupEntry {
  device_type: StartupDeviceType;
  content: string;
  enabled: boolean;
}

export interface ConfigurationSet {
  id: string;
  name: string;
  nodes: Record<string, StartupEntry>;
}

export type StartupSelection = { kind: 'none' } | { kind: 'set'; set_id: string };

/** Result of one startup choice for several nodes; `without_startup` boot with their image defaults. */
export interface BulkSelectionResult {
  revision: number;
  node_ids: string[];
  without_startup: string[];
}

export interface StartupDocument {
  version: number;
  revision: number;
  selected: string;
  sets: ConfigurationSet[];
  selection_revision?: number;
  selections?: Record<string, StartupSelection>;
}

const isRecord = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object';

/**
 * Keep only the fields this UI knows: the server rejects unknown fields on save, so none may be echoed back.
 */
export function normalizeStartupDocument(raw: any): StartupDocument {
  if (!isRecord(raw)) return raw;
  const document: StartupDocument = {
    version: raw.version,
    revision: raw.revision,
    selected: raw.selected,
    sets: (Array.isArray(raw.sets) ? raw.sets : []).filter(isRecord).map((set) => {
      const nodes: Record<string, StartupEntry> = {};
      for (const [nodeId, entry] of Object.entries<any>(isRecord(set.nodes) ? set.nodes : {})) {
        if (!isRecord(entry)) continue;
        nodes[nodeId] = { device_type: entry.device_type, content: entry.content ?? '', enabled: !!entry.enabled };
      }
      return { id: set.id, name: set.name, nodes };
    }),
  };
  if (raw.selection_revision !== undefined && raw.selection_revision !== null) {
    document.selection_revision = raw.selection_revision;
  }
  if (isRecord(raw.selections)) {
    document.selections = {};
    for (const [nodeId, selection] of Object.entries<any>(raw.selections)) {
      if (!isRecord(selection)) continue;
      document.selections[nodeId] =
        selection.kind === 'set' && selection.set_id ? { kind: 'set', set_id: selection.set_id } : { kind: 'none' };
    }
  }
  return document;
}

export interface ConfigurationJob {
  id: string;
  set_id: string;
  status: string;
  operation: string;
  nodes: Record<string, string>;
  /** Where a failed live apply stopped, per node (masked by the server). */
  details?: Record<string, StartupFailureContext>;
}

/** Where a console apply stopped; every field may be absent. */
export interface StartupFailureContext {
  phase?: string;
  command_index?: number;
  command_total?: number;
  command?: string;
  device_error?: string;
}

export interface StartupStatus {
  revision?: number;
  selection_revision?: number;
  jobs: ConfigurationJob[];
  nodes: Record<string, StartupNodeStatus>;
}

/** Last startup apply result of one node; everything except `status` and `set_id` may be absent. */
export interface StartupNodeStatus extends StartupFailureContext {
  status: string;
  set_id: string;
}

const positiveInteger = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
const text = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

/** Tolerant reader of `GET startup-configurations/status`: never throws, drops malformed fields. */
export function normalizeStartupStatus(raw: any): StartupStatus {
  if (!isRecord(raw)) return raw;
  const nodes: Record<string, StartupNodeStatus> = {};
  for (const [nodeId, value] of Object.entries<any>(isRecord(raw.nodes) ? raw.nodes : {})) {
    if (!isRecord(value)) continue;
    const node: StartupNodeStatus = { status: value.status, set_id: value.set_id };
    const optional = {
      phase: text(value.phase),
      command_index: positiveInteger(value.command_index),
      command_total: positiveInteger(value.command_total),
      command: text(value.command),
      device_error: text(value.device_error),
    };
    for (const [key, field] of Object.entries(optional)) {
      if (field !== undefined) (node as any)[key] = field;
    }
    nodes[nodeId] = node;
  }
  return { ...raw, jobs: Array.isArray(raw.jobs) ? raw.jobs : [], nodes };
}

/** Result of `POST startup-configurations/import`. */
export interface SetImportResult {
  set: { id: string; name: string };
  mapped: Record<string, string>;
  /** Archive nodes that were given to the project node of the same name (their ids differ). */
  matched_by_name: { node_id: string; node_name: string; target_id: string }[];
  skipped: { node_id: string; node_name: string; reason: string }[];
}

const IMPORT_REPORT_NAMES = 3;

function importedNames(names: string[]): string {
  return names.slice(0, IMPORT_REPORT_NAMES).join(', ') + (names.length > IMPORT_REPORT_NAMES ? ', …' : '');
}

/** One sentence per outcome of a set import: what was matched by name and what stayed out, with node names. */
export function importResultMessage(result: SetImportResult): string {
  const matched = result.matched_by_name;
  const skipped = result.skipped || [];
  let message = `Imported configuration set "${result.set.name}".`;
  if (matched.length) {
    message += ` ${matched.length} node${matched.length === 1 ? ' was' : 's were'} matched by name: ${importedNames(
      matched.map((item) => item.node_name),
    )}.`;
  }
  if (skipped.length) {
    message += ` ${skipped.length} node${skipped.length === 1 ? ' was' : 's were'} skipped: ${importedNames(
      skipped.map((item) => `${item.node_name || item.node_id} (${item.reason.replace(/_/g, ' ')})`),
    )}.`;
  }
  return message;
}

/** Startup can be switched ON for an entry with text that the node (when given) can restore. */
export function canEnableStartup(entry: StartupEntry | undefined, node?: Node, lookup?: StartupProfileLookup): boolean {
  return !!entry?.device_type && !(node && startupBlocker(node, entry, lookup)) && !!entry.content.trim();
}

/** An entry holds text that can be started from. */
export function hasSavedConfiguration(entry: StartupEntry | undefined): boolean {
  return !!entry?.content.trim();
}

/** Whether the startup switch may be flipped: turning OFF is always allowed, ON needs an applicable entry. */
export function canToggleStartupEntry(
  entry: StartupEntry | undefined,
  node?: Node,
  lookup?: StartupProfileLookup,
): boolean {
  return hasSavedConfiguration(entry) && (entry.enabled || canEnableStartup(entry, node, lookup));
}

export type StartupToggleState = 'unavailable' | 'off' | 'on';

export function startupToggleState(entry: StartupEntry | undefined, enabled: boolean): StartupToggleState {
  if (enabled) return 'on';
  return hasSavedConfiguration(entry) ? 'off' : 'unavailable';
}

const FILE_EXTENSIONS: Readonly<Partial<Record<StartupDeviceType, string>>> = {
  frr: 'conf',
  vpcs: 'vpc',
  mikrotik_routeros: 'rsc',
  paloalto_panos: 'xml',
};

export function configurationFileExtension(deviceType: StartupDeviceType): string {
  return FILE_EXTENSIONS[deviceType] ?? 'cfg';
}

/** The download name of a node's configuration; the extension comes from `configurationFileExtension`. */
export function configurationFileName(nodeName: string, extension: string): string {
  return `${nodeName}_configuration.${extension}`;
}

export function startupSetId(document: StartupDocument | null, nodeId: string): string | undefined {
  const selection = document?.selections?.[nodeId];
  return selection ? (selection.kind === 'set' ? selection.set_id : undefined) : document?.selected;
}

export function startupEntryEnabled(
  document: StartupDocument | null,
  nodeId: string,
  setId: string,
  entry: StartupEntry | undefined,
): boolean {
  return startupSetId(document, nodeId) === setId && !!entry?.enabled && hasSavedConfiguration(entry);
}

/** The set selected for a clean boot, independent of the guest's current runtime. */
export function nextStartDescription(document: StartupDocument | null, nodeId: string): string {
  if (!document) return '';
  const set = document.sets.find((item) => item.id === startupSetId(document, nodeId));
  const entry = set?.nodes[nodeId];
  if (!set || !entry?.enabled || !hasSavedConfiguration(entry)) {
    return 'No saved set selected for a clean boot.';
  }
  const inherited = document.selections?.[nodeId] ? '' : ' (the project default)';
  return `Selected for a clean boot: "${set.name}"${inherited}.`;
}

export function assignStartupSet(document: StartupDocument, nodeId: string, setId: string | null) {
  document.selection_revision ??= 0;
  document.selections = {
    ...document.selections,
    [nodeId]: setId ? { kind: 'set', set_id: setId } : { kind: 'none' },
  };
}

/** Control characters other than tab, newline, carriage return and form feed mean "not a text file". */
const BINARY_CONTROL = /[\x00-\x08\x0e-\x1f]/;

type ConfigurationFileProblem = 'too_large' | 'binary';

/**
 * Client-side check of a text configuration before it is sent. The server stays
 * authoritative; this only avoids a round trip and gives a clear reason.
 */
export function configurationFileProblem(size: number, text?: string): ConfigurationFileProblem | undefined {
  if (size > MAX_CONFIGURATION_BYTES) return 'too_large';
  if (text !== undefined && BINARY_CONTROL.test(text)) return 'binary';
  return undefined;
}

export const CONFIGURATION_FILE_PROBLEMS: Record<ConfigurationFileProblem, string> = {
  too_large: 'Configuration exceeds 2 MiB.',
  binary: 'This file looks binary, not a text configuration. Choose a text configuration file.',
};
