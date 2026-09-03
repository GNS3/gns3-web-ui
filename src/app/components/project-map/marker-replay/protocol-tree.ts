import { ProtocolTreeNode } from '@models/marker-replay';

/**
 * Pure helpers for the flat (non-recursive) protocol-tree renderer.
 *
 * The decoded PDML tree is immutable per frame, so rows are derived state:
 * a depth-first flattening that only descends into nodes whose key sits in
 * the caller's expansion set. Keeping this pure makes collapse/expand,
 * "expand all" and selection trivial signal updates in the component — no
 * per-node state scattered across recursive component instances.
 */

/** One visible row of the flattened tree. */
export interface FlatRow {
  /** Stable path key ("/0/2/1" — index path from the tree root). */
  key: string;
  /**
   * Semantic path ("ip/ip.ttl" — node NAMES, occurrence-disambiguated). Stable
   * across trees of the same packet even when hidden noise shifts indexes, so
   * cross-tree diffs (replay-tree-diff) and row highlights share one keyspace.
   */
  path: string;
  node: ProtocolTreeNode;
  depth: number;
  hasChildren: boolean;
}

/** Row text: the showname, else `name: show`, else the bare name. */
export function rowText(n: ProtocolTreeNode): string {
  return n.showname ?? (n.show !== undefined ? `${n.name}: ${n.show}` : n.name);
}

/**
 * Case-insensitive search haystack for a row: the field NAME plus its
 * displayed text (showname, else show) — so both literals ("Time to Live:
 * 64") and field names ("ttl") find their row. The raw hex `value` is
 * deliberately excluded: a query like "40" would light up half the hex
 * column; Wireshark's find-in-details matches displayed text too.
 */
export function rowSearchText(n: ProtocolTreeNode): string {
  return `${n.name} ${n.showname ?? n.show ?? ''}`.toLowerCase();
}

/** Row keys of every ancestor ("/0/1/0" → ["/0/1", "/0"]) — reveal set for search. */
export function ancestorKeys(key: string): string[] {
  const out: string[] = [];
  let k = key;
  for (;;) {
    const cut = k.lastIndexOf('/');
    if (cut <= 0) return out;
    k = k.slice(0, cut);
    out.push(k);
  }
}

/** Hover context: raw field name, show/value attributes, byte range. */
export function rowTooltip(n: ProtocolTreeNode): string {
  const parts = [n.show ?? '', n.value ?? ''].filter(Boolean);
  let text = parts.length ? `${n.name} · ${parts.join(' · ')}` : n.showname || n.name;
  if (n.pos !== undefined && n.size !== undefined) text += `  [${n.pos}+${n.size}]`;
  return text;
}

/**
 * Protos tshark emits as PDML plumbing that Wireshark's GUI never displays
 * (`geninfo` duplicates the `frame` proto's Number/Length/Time fields).
 */
const UNDISPLAYED_PROTOS = new Set(['geninfo']);

/**
 * Whether a node renders at all. tshark marks filter-only combination fields
 * (`ip.addr`, `ip.host`, `eth.addr`, OUI, resolved duplicates…) with
 * `hide="yes"` — Wireshark hides them, so we do too. "true" is tolerated for
 * robustness; missing/other values display.
 */
export function isHidden(n: ProtocolTreeNode): boolean {
  return (
    n.hide === 'yes' ||
    n.hide === 'true' ||
    (n.element === 'proto' && UNDISPLAYED_PROTOS.has(n.name))
  );
}

/** Direct children that render — hidden filter-combination noise is dropped. */
export function visibleChildren(n: ProtocolTreeNode): ProtocolTreeNode[] {
  return (n.children ?? []).filter((c) => !isHidden(c));
}

/**
 * A parent's visible children paired with their semantic paths. Repeated
 * sibling names (e.g. two `tcp.options` branches) get an occurrence suffix
 * (`tcp.options[1]`) so paths stay deterministic under insertion.
 */
export function visibleChildEntries(
  nodes: ProtocolTreeNode[],
  parentPath: string
): { node: ProtocolTreeNode; path: string }[] {
  const totals = new Map<string, number>();
  for (const n of nodes) {
    if (isHidden(n)) continue;
    totals.set(n.name, (totals.get(n.name) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const out: { node: ProtocolTreeNode; path: string }[] = [];
  for (const n of nodes) {
    if (isHidden(n)) continue;
    const k = seen.get(n.name) ?? 0;
    seen.set(n.name, k + 1);
    const seg = (totals.get(n.name) ?? 1) > 1 ? `${n.name}[${k}]` : n.name;
    out.push({ node: n, path: parentPath ? `${parentPath}/${seg}` : seg });
  }
  return out;
}

/**
 * Flatten the decoded tree into the rows currently visible: a child-bearing
 * node only contributes its children while its key is in `expanded`. Keys are
 * index paths within the (hide-filtered) arrays, stable for one decode.
 */
export function flattenTree(tree: ProtocolTreeNode[], expanded: ReadonlySet<string>): FlatRow[] {
  const rows: FlatRow[] = [];
  const walk = (nodes: ProtocolTreeNode[], prefix: string, parentPath: string, depth: number): void => {
    // Semantic paths precomputed once per sibling array; the ROW key keeps the
    // ORIGINAL array index (hidden siblings included) — stable for one decode.
    const paths = new Map(visibleChildEntries(nodes, parentPath).map((e) => [e.node, e.path]));
    nodes.forEach((node, i) => {
      if (isHidden(node)) return;
      const key = `${prefix}/${i}`;
      const path = paths.get(node) ?? node.name;
      const kids = visibleChildren(node);
      rows.push({ key, path, node, depth, hasChildren: kids.length > 0 });
      if (kids.length > 0 && expanded.has(key)) walk(kids, key, path, depth + 1);
    });
  };
  walk(tree, '', '', 0);
  return rows;
}

/** Keys of every child-bearing node — the expansion set for "Expand all". */
export function collectKeys(tree: ProtocolTreeNode[]): string[] {
  const keys: string[] = [];
  const walk = (nodes: ProtocolTreeNode[], prefix: string): void => {
    nodes.forEach((node, i) => {
      if (isHidden(node)) return;
      const key = `${prefix}/${i}`;
      const kids = visibleChildren(node);
      if (kids.length > 0) keys.push(key);
      walk(kids, key);
    });
  };
  walk(tree, '');
  return keys;
}
