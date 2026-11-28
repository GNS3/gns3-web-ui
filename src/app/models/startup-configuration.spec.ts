import { describe, expect, it } from 'vitest';
import {
  assignStartupSet,
  canEnableStartup,
  canToggleStartupEntry,
  configurationFileProblem,
  configurationFileExtension,
  importResultMessage,
  nextStartDescription,
  normalizeStartupStatus,
  SetImportResult,
  startupEntryEnabled,
  StartupDocument,
  startupSetId,
} from '@models/startup-configuration';
import { Node } from '../cartography/models/node';

const setA = '00000000-0000-0000-0000-000000000000';
const setB = '00000000-0000-0000-0000-00000000000b';

/** A started QEMU node with the usual fixture fields; tests override what they exercise. */
const started = (overrides: Partial<Node> = {}) =>
  ({
    node_id: 'node-1',
    project_id: 'project-1',
    name: 'R1',
    node_type: 'qemu',
    status: 'started',
    properties: {},
    ...overrides,
  }) as Node;

describe('normalizeStartupStatus', () => {
  it('keeps the masked failure context', () => {
    const status = normalizeStartupStatus({
      jobs: [],
      nodes: {
        n1: {
          status: 'configuration_apply_failed',
          set_id: 's',
          phase: 'line',
          command_index: 6,
          command_total: 101,
          command: 'password <masked>',
          device_error: 'syntax error: password <masked>',
        },
      },
    });
    expect(status.nodes['n1']).toEqual({
      status: 'configuration_apply_failed',
      set_id: 's',
      phase: 'line',
      command_index: 6,
      command_total: 101,
      command: 'password <masked>',
      device_error: 'syntax error: password <masked>',
    });
  });
  it('accepts absent context and unknown phases without throwing', () => {
    const status = normalizeStartupStatus({
      nodes: { a: { status: 'applied', set_id: 's' }, b: { status: 'x', set_id: 's', phase: 'future' } },
    });
    expect(status.jobs).toEqual([]);
    expect(status.nodes['a']).toEqual({ status: 'applied', set_id: 's' });
    expect(status.nodes['b'].phase).toBe('future');
  });
  it('drops malformed fields and entries', () => {
    const status = normalizeStartupStatus({
      jobs: 'bad',
      nodes: {
        a: { status: 's', set_id: 'x', phase: 5, command_index: -1, command_total: '9', command: {}, device_error: '' },
        b: null,
      },
    });
    expect(status.jobs).toEqual([]);
    expect(Object.keys(status.nodes)).toEqual(['a']);
    expect(status.nodes['a']).toEqual({ status: 's', set_id: 'x' });
    expect(normalizeStartupStatus({}).nodes).toEqual({});
    expect(normalizeStartupStatus(null)).toBeNull();
  });
});

describe('importResultMessage', () => {
  const result = (extra: Partial<SetImportResult> = {}): SetImportResult => ({
    set: { id: 's', name: 'Lab' },
    mapped: {},
    matched_by_name: [],
    skipped: [],
    ...extra,
  });

  it('names only the set when every node was matched by id', () => {
    expect(importResultMessage(result())).toBe('Imported configuration set "Lab".');
  });

  it('lists the nodes matched by name and tolerates a server that does not report them', () => {
    const matched = ['R1', 'R2', 'R3', 'R4'].map((name) => ({ node_id: name, node_name: name, target_id: 'x' }));
    expect(importResultMessage(result({ matched_by_name: matched.slice(0, 1) }))).toContain(
      '1 node was matched by name: R1.',
    );
    expect(importResultMessage(result({ matched_by_name: matched }))).toContain(
      '4 nodes were matched by name: R1, R2, R3, ….',
    );
  });

  it('lists the skipped nodes with a readable reason', () => {
    const skipped = [
      { node_id: 'a', node_name: 'R1', reason: 'node_name_ambiguous' },
      { node_id: 'b', node_name: '', reason: 'node_not_found' },
    ];
    expect(importResultMessage(result({ skipped }))).toContain(
      '2 nodes were skipped: R1 (node name ambiguous), b (node not found).',
    );
  });
});

describe('nextStartDescription', () => {
  const entry = { device_type: 'cisco_ios_telnet', content: 'hostname R1', enabled: true };
  const document = (extra: Partial<StartupDocument> = {}, node = entry): StartupDocument =>
    ({
      version: 1,
      revision: 1,
      selected: 'default',
      sets: [
        { id: 'default', name: 'Default', nodes: { n1: node } },
        { id: 'lab', name: 'Lab', nodes: { n1: entry } },
      ],
      ...extra,
    }) as StartupDocument;

  it('says nothing before the document is loaded', () => {
    expect(nextStartDescription(null, 'n1')).toBe('');
  });

  it('names the project default set when the node has no choice of its own', () => {
    expect(nextStartDescription(document(), 'n1')).toBe('Selected for a clean boot: "Default" (the project default).');
  });

  it('names the set a node was assigned', () => {
    const assigned = document({ selections: { n1: { kind: 'set', set_id: 'lab' } } });
    expect(nextStartDescription(assigned, 'n1')).toBe('Selected for a clean boot: "Lab".');
  });

  it('reports the image defaults when nothing will be delivered', () => {
    const none = 'No saved set selected for a clean boot.';
    expect(nextStartDescription(document({ selections: { n1: { kind: 'none' } } }), 'n1')).toBe(none);
    expect(nextStartDescription(document({}, { ...entry, enabled: false }), 'n1')).toBe(none);
    expect(nextStartDescription(document({}, { ...entry, content: '  ' }), 'n1')).toBe(none);
    expect(nextStartDescription(document(), 'other-node')).toBe(none);
  });
});

describe('canEnableStartup', () => {
  it('refuses an entry the node cannot restore', () => {
    const entry = { device_type: 'cisco_asa' as const, content: 'hostname A', enabled: false };
    expect(canEnableStartup(entry, started({ netmiko_device_type: 'cisco_asa' }))).toBe(true);
    expect(canEnableStartup(entry, started({ netmiko_device_type: null }))).toBe(false);
    expect(canEnableStartup(entry, started({ netmiko_device_type: 'cisco_asa', console_type: 'vnc' }))).toBe(false);
    expect(canEnableStartup(entry, started({ netmiko_device_type: 'cisco_nxos' }))).toBe(false);
  });
  it('enables a boot media entry without a Netmiko type or a console, and refuses a wrong entry type', () => {
    const viptela = started({ properties: { startup_media_profile: 'cisco-viptela' } as any, console_type: 'vnc' });
    const entry = { device_type: 'cisco_viptela' as const, content: 'system', enabled: false };
    expect(canEnableStartup(entry, viptela)).toBe(true);
    expect(canToggleStartupEntry(entry, viptela)).toBe(true);
    expect(canEnableStartup({ ...entry, device_type: 'cisco_ios_telnet' }, viptela)).toBe(false);
  });
  it('needs content', () => {
    expect(canEnableStartup(undefined)).toBe(false);
    expect(canEnableStartup({ device_type: 'vpcs', content: '  ', enabled: false })).toBe(false);
    expect(canEnableStartup({ device_type: 'vpcs', content: 'ip 1.1.1.1', enabled: false })).toBe(true);
  });
});

describe('selection helpers', () => {
  const document = (): StartupDocument => ({
    version: 1,
    revision: 0,
    selected: setA,
    sets: [
      { id: setA, name: 'Default', nodes: {} },
      { id: setB, name: 'B', nodes: {} },
    ],
  });
  it('falls back to the project default set without a per-node selection', () => {
    expect(startupSetId(document(), 'n')).toBe(setA);
    expect(startupSetId(null, 'n')).toBeUndefined();
  });
  it('uses the per-node selection, including "none", which has no set', () => {
    const doc = document();
    assignStartupSet(doc, 'n', setB);
    expect(startupSetId(doc, 'n')).toBe(setB);
    assignStartupSet(doc, 'n', null);
    expect(startupSetId(doc, 'n')).toBeUndefined();
    expect(doc.selection_revision).toBe(0);
  });
  it('reports an entry as enabled only when assigned to that set, enabled and non-empty', () => {
    const doc = document();
    const entry = { device_type: 'vpcs' as const, content: 'ip', enabled: true };
    expect(startupEntryEnabled(doc, 'n', setA, entry)).toBe(true);
    expect(startupEntryEnabled(doc, 'n', setB, entry)).toBe(false);
    expect(startupEntryEnabled(doc, 'n', setA, { ...entry, content: ' ' })).toBe(false);
    expect(startupEntryEnabled(doc, 'n', setA, { ...entry, enabled: false })).toBe(false);
    expect(startupEntryEnabled(doc, 'n', setA, undefined)).toBe(false);
  });
});

describe('configurationFileExtension', () => {
  it.each([
    ['vpcs', 'vpc'],
    ['mikrotik_routeros', 'rsc'],
    ['paloalto_panos', 'xml'],
    ['cisco_asa', 'cfg'],
  ])('%s -> .%s', (deviceType, extension) => {
    expect(configurationFileExtension(deviceType as any)).toBe(extension);
  });
});

describe('configurationFileProblem', () => {
  it('rejects oversized and binary files, accepts normal text', () => {
    expect(configurationFileProblem(2 * 1024 * 1024 + 1)).toBe('too_large');
    expect(configurationFileProblem(10, 'hostname R1\r\n\tdescription x\f')).toBeUndefined();
    expect(configurationFileProblem(10, 'abc\u0000def')).toBe('binary');
    expect(configurationFileProblem(10, 'abc\u0007')).toBe('binary');
  });
});
