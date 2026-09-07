import { describe, it, expect } from 'vitest';
import { ProtocolTreeNode } from '@models/marker-replay';
import { diffTrees, ancestorPaths } from './replay-tree-diff';

/**
 * Minimal IPv4-ish sharkd tree: proto › leaves. `label` is both the display
 * text and the comparison value — there is no separate hex/value layer.
 */
const hopTree = (ttl: string, srcMac: string): ProtocolTreeNode[] => [
  {
    element: 'proto',
    name: 'eth',
    label: 'Ethernet II',
    children: [{ element: 'field', name: 'eth.src', label: `Source: ${srcMac}`, children: [] }],
  },
  {
    element: 'proto',
    name: 'ip',
    label: 'Internet Protocol Version 4',
    children: [
      { element: 'field', name: 'ip.ttl', label: `Time to Live: ${ttl}`, children: [] },
      { element: 'field', name: 'ip.src', label: 'Source: 10.0.0.1', children: [] },
    ],
  },
];

describe('diffTrees', () => {
  it('flags only the leaves whose labels differ across trees', () => {
    const changed = diffTrees([hopTree('64', 'aa:aa'), hopTree('63', 'aa:aa'), hopTree('62', 'aa:aa')]);
    // Same packet across hops: TTL decrements, everything else identical.
    expect(changed.has('ip/ip.ttl')).toBe(true);
    expect(changed.has('eth/eth.src')).toBe(false);
    expect(changed.has('ip/ip.src')).toBe(false);
    expect(changed.size).toBe(1);
  });

  it('flags every disagreeing leaf (MAC rewrite + TTL together)', () => {
    const changed = diffTrees([hopTree('64', 'aa:aa'), hopTree('63', 'bb:bb')]);
    expect(changed.has('ip/ip.ttl')).toBe(true);
    expect(changed.has('eth/eth.src')).toBe(true);
    expect(changed.size).toBe(2);
  });

  it('never diffs below two trees and agrees on identical trees', () => {
    expect(diffTrees([hopTree('64', 'aa:aa')]).size).toBe(0);
    expect(diffTrees([]).size).toBe(0);
    expect(diffTrees([hopTree('64', 'aa:aa'), hopTree('64', 'aa:aa')]).size).toBe(0);
  });

  it('treats a path missing from one tree as changed (extra VLAN hop)', () => {
    const withVlan: ProtocolTreeNode[] = [
      ...hopTree('64', 'aa:aa'),
      {
        element: 'proto',
        name: 'vlan',
        label: '802.1Q Virtual LAN',
        children: [{ element: 'field', name: 'vlan.id', label: 'ID: 10', children: [] }],
      },
    ];
    const changed = diffTrees([hopTree('64', 'aa:aa'), withVlan]);
    expect(changed.has('vlan/vlan.id')).toBe(true);
    // The shared paths still align and stay unchanged.
    expect(changed.has('ip/ip.ttl')).toBe(false);
  });

  it('never descends into undisplayed plumbing protos (geninfo)', () => {
    const withPlumbing = (v: string): ProtocolTreeNode[] => [
      ...hopTree('64', 'aa:aa'),
      {
        element: 'proto',
        name: 'geninfo',
        label: 'General information',
        children: [{ element: 'field', name: 'num', label: `Number: ${v}`, children: [] }],
      },
    ];
    const changed = diffTrees([withPlumbing('1'), withPlumbing('2')]);
    expect(changed.has('geninfo/num')).toBe(false);
  });

  it('disambiguates repeated sibling names instead of colliding paths', () => {
    const tree = (): ProtocolTreeNode[] => [
      {
        element: 'proto',
        name: 'tcp',
        label: 'Transmission Control Protocol',
        children: [
          { element: 'field', name: 'tcp.options', label: 'A: 1', children: [] },
          { element: 'field', name: 'tcp.options', label: 'B: 1', children: [] },
        ],
      },
    ];
    // Only the SECOND tcp.options differs — the first must stay unchanged.
    const a = tree();
    const b = tree();
    b[0].children![1].label = 'B: 2';
    const diff = diffTrees([a, b]);
    expect(diff.has('tcp/tcp.options[0]')).toBe(false);
    expect(diff.has('tcp/tcp.options[1]')).toBe(true);
    expect(diff.size).toBe(1);
  });
});

describe('ancestorPaths', () => {
  it('returns every strict ancestor prefix of the changed leaves', () => {
    const anc = ancestorPaths(new Set(['ip/ip.ttl', 'eth/eth.src']));
    expect(anc.has('ip')).toBe(true);
    expect(anc.has('eth')).toBe(true);
    expect(anc.size).toBe(2); // no leaf paths, no empty strings
  });

  it('handles deeply nested paths', () => {
    const anc = ancestorPaths(new Set(['ip/ip.options/ip.option-timestamp/ts.timestamp']));
    expect([...anc].sort()).toEqual(['ip', 'ip/ip.options', 'ip/ip.options/ip.option-timestamp']);
  });

  it('empty for root-level paths', () => {
    expect(ancestorPaths(new Set(['frame.number'])).size).toBe(0);
  });
});
