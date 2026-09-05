import { describe, it, expect } from 'vitest';
import { ProtocolTreeNode } from '@models/marker-replay';
import { diffTrees, ancestorPaths } from './replay-tree-diff';

/** Minimal IPv4-ish tree: proto › leaves, plus one hidden combination field. */
const hopTree = (ttl: string, srcMac: string): ProtocolTreeNode[] => [
  {
    element: 'proto',
    name: 'eth',
    showname: 'Ethernet II',
    children: [
      // value (hex) tracks srcMac — the diff compares value first, so a
      // display-only `show` drift must NOT count as a packet change.
      { element: 'field', name: 'eth.src', showname: `Source: ${srcMac}`, show: srcMac, value: srcMac.split(':').join(''), children: [] },
      { element: 'field', name: 'eth.addr', showname: 'combo', hide: 'yes', children: [] },
    ],
  },
  {
    element: 'proto',
    name: 'ip',
    showname: 'Internet Protocol Version 4',
    children: [
      { element: 'field', name: 'ip.ttl', showname: `Time to Live: ${ttl}`, show: ttl, value: ttl === '64' ? '40' : '3f', children: [] },
      { element: 'field', name: 'ip.src', showname: 'Source: 10.0.0.1', show: '10.0.0.1', value: '0a000001', children: [] },
    ],
  },
];

describe('diffTrees', () => {
  it('flags only the leaves whose values differ across trees', () => {
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
        showname: '802.1Q',
        children: [{ element: 'field', name: 'vlan.id', showname: 'ID: 10', show: '10', children: [] }],
      },
    ];
    const changed = diffTrees([hopTree('64', 'aa:aa'), withVlan]);
    expect(changed.has('vlan/vlan.id')).toBe(true);
    // The shared paths still align and stay unchanged.
    expect(changed.has('ip/ip.ttl')).toBe(false);
  });

  it('ignores hidden (filter-combination) fields, matching the renderer', () => {
    const changed = diffTrees([hopTree('64', 'aa:aa'), hopTree('63', 'bb:bb')]);
    expect(changed.has('eth/eth.addr')).toBe(false);
  });

  it('display-only drift (same hex value) is not a packet change', () => {
    const a = hopTree('64', 'aa:aa');
    const b = hopTree('64', 'aa:aa');
    b[0].children![0].showname = 'Source: resolved-host.example'; // same value hex
    expect(diffTrees([a, b]).size).toBe(0);
  });

  it('disambiguates repeated sibling names instead of colliding paths', () => {
    const tree = (): ProtocolTreeNode[] => [
      {
        element: 'proto',
        name: 'tcp',
        showname: 'TCP',
        children: [
          { element: 'field', name: 'tcp.options', showname: 'A: 1', show: '1', children: [] },
          { element: 'field', name: 'tcp.options', showname: 'B: 1', show: '1', children: [] },
        ],
      },
    ];
    // Only the SECOND tcp.options differs — the first must stay unchanged.
    const a = tree();
    const b = tree();
    b[0].children![1].show = '2';
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
