import { ProtocolTreeNode } from '@models/marker-replay';
import { visibleChildEntries } from './protocol-tree';

/**
 * Pure leaf-level diff across N decoded protocol trees — the engine behind
 * pinned-window comparison ("this packet at 4 hops: what changed per hop?").
 *
 * The same L3 packet traversing a path keeps an IDENTICAL tree structure
 * across hops; only leaf values legitimately drift (TTL −1, rewritten
 * eth.src/dst, recomputed checksums). So leaves are matched by SEMANTIC path
 * (`ip/ip.ttl` — node names, see {@link visibleChildEntries}), never by array
 * index: a field insertion on one hop (an extra VLAN header) shifts indexes
 * but leaves the shared paths aligned.
 *
 * Paths share the keyspace with `FlatRow.path`, so the renderer highlights
 * rows directly from the returned set.
 */

/** A tree's leaves as (semantic path → comparable value). */
function leafEntries(tree: ProtocolTreeNode[]): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (nodes: ProtocolTreeNode[], parentPath: string): void => {
    for (const { node, path } of visibleChildEntries(nodes, parentPath)) {
      const kids = node.children ?? [];
      if (visibleChildEntries(kids, path).length === 0) {
        // Hex `value` is the most precise; show/showname degrade gracefully.
        out.set(path, node.value ?? node.show ?? node.showname ?? '');
      } else {
        walk(kids, path);
      }
    }
  };
  walk(tree, '');
  return out;
}

/**
 * Paths on which the trees DISAGREE: a value mismatch, or the path existing in
 * only some trees (structural difference — e.g. a VLAN proto present on one
 * hop). Fewer than two trees → empty set (nothing to compare).
 */
export function diffTrees(trees: ProtocolTreeNode[][]): Set<string> {
  if (trees.length < 2) return new Set();
  const maps = trees.map(leafEntries);
  const allPaths = new Set<string>();
  for (const m of maps) for (const path of m.keys()) allPaths.add(path);
  const changed = new Set<string>();
  for (const path of allPaths) {
    const first = maps[0].get(path);
    if (maps.some((m) => m.get(path) !== first)) changed.add(path);
  }
  return changed;
}

/**
 * Strict ancestor paths of the changed leaves ("ip" for "ip/ip.ttl") — lets a
 * COLLAPSED protocol row still show "something inside changed" while the leaf
 * itself stays hidden until expanded.
 */
export function ancestorPaths(changed: ReadonlySet<string>): Set<string> {
  const out = new Set<string>();
  for (const path of changed) {
    let i = path.indexOf('/');
    while (i > 0) {
      out.add(path.slice(0, i));
      i = path.indexOf('/', i + 1);
    }
  }
  return out;
}
