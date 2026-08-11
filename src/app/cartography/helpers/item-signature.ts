/**
 * Per-item visual signatures with grouped sub-signatures — used by
 * GraphDataManager for incremental diff and by dom-patcher for dispatching
 * targeted DOM updates (e.g. position change → transform; text change →
 * getBBox; path change → recalc d).
 *
 * Field sets are kept in sync with D3MapComponent.signatureOfNodes /
 * signatureOfLinks / signatureOfDrawings.  Link signatures exclude `markers`
 * (marker-flash has its own per-frame batched update path).
 */

export type NodeSigGroup = 'xY' | 'z' | 'visual' | 'label' | 'ports' | 'type';
export type LinkSigGroup = 'nodes' | 'visual';
export type DrawingSigGroup = 'xY' | 'z' | 'visual';

export interface ItemSignatures<T extends string = string> {
  all: string;
  groups: Record<T, string>;
}

export interface AffectedIds {
  additions: { nodes: string[]; links: string[]; drawings: string[] };
  updates: Map<string, string[] /* changed group names */>;
  removals: { nodes: string[]; links: string[]; drawings: string[] };
}

export function emptyAffectedIds(): AffectedIds {
  return {
    additions: { nodes: [], links: [], drawings: [] },
    updates: new Map(),
    removals: { nodes: [], links: [], drawings: [] },
  };
}

export function mergeAffected(base: AffectedIds, ...others: AffectedIds[]): AffectedIds {
  for (const o of others) {
    base.additions.nodes.push(...o.additions.nodes);
    base.additions.links.push(...o.additions.links);
    base.additions.drawings.push(...o.additions.drawings);
    base.removals.nodes.push(...o.removals.nodes);
    base.removals.links.push(...o.removals.links);
    base.removals.drawings.push(...o.removals.drawings);
    for (const [id, groups] of o.updates) {
      const existing = base.updates.get(id);
      if (existing) {
        for (const g of groups) if (!existing.includes(g)) existing.push(g);
      } else {
        base.updates.set(id, [...groups]);
      }
    }
  }
  return base;
}

export function affectedIsEmpty(a: AffectedIds): boolean {
  return (
    a.additions.nodes.length === 0 &&
    a.additions.links.length === 0 &&
    a.additions.drawings.length === 0 &&
    a.removals.nodes.length === 0 &&
    a.removals.links.length === 0 &&
    a.removals.drawings.length === 0 &&
    a.updates.size === 0
  );
}

// ── Node ────────────────────────────────────────────────────────

export function nodeSignatures(
  n: { node_id: string; x: number; y: number; z: number; symbol: string; symbol_url: string; width: number; height: number; status: string; locked: boolean; name: string; node_type: string; first_port_name: string; port_name_format: string; port_segment_size: number; label: unknown; ports: unknown }
): ItemSignatures<NodeSigGroup> {
  const xY = `${n.x}|${n.y}`;
  const z = `${n.z}`;
  const visual = `${n.symbol}|${n.symbol_url}|${n.width}|${n.height}|${n.status}|${n.locked}|${n.name}`;
  const label = JSON.stringify(n.label);
  const ports = JSON.stringify(n.ports);
  const type = `${n.node_type}|${n.first_port_name}|${n.port_name_format}|${n.port_segment_size}`;
  return {
    all: `${n.node_id}|${xY}|${z}|${visual}|${label}|${ports}|${type}`,
    groups: { xY, z, visual, label, ports, type },
  };
}

// ── Link ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function linkSignatures(l: any): ItemSignatures<LinkSigGroup> {
  const nodes = JSON.stringify(l.nodes);
  const visual = `${l.capturing}|${l.suspend}|${l.show_filters_icon}|${l.wireshark}|${l.link_type}|${JSON.stringify(l.filters)}|${JSON.stringify(l.link_style)}`;
  return {
    all: `${l.link_id}|${nodes}|${visual}`,
    groups: { nodes, visual },
  };
}

// ── Drawing ─────────────────────────────────────────────────────

export function drawingSignatures(
  d: { drawing_id: string; x: number; y: number; z: number; rotation: number; locked: boolean; svg: string }
): ItemSignatures<DrawingSigGroup> {
  const xY = `${d.x}|${d.y}`;
  const z = `${d.z}`;
  const visual = `${d.rotation}|${d.locked}|${d.svg}`;
  return {
    all: `${d.drawing_id}|${xY}|${z}|${visual}`,
    groups: { xY, z, visual },
  };
}

// ── Diff helper ─────────────────────────────────────────────────

export function changedGroups<T extends string>(
  oldGroups: Record<T, string> | undefined,
  curGroups: Record<T, string>
): T[] {
  if (!oldGroups) return Object.keys(curGroups) as T[];
  const changed: T[] = [];
  for (const k of Object.keys(oldGroups) as T[]) {
    if (oldGroups[k] !== curGroups[k]) changed.push(k);
  }
  return changed;
}
