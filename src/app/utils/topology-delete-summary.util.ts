export interface TopologyItemCounts {
  nodes: number;
  links: number;
  drawings: number;
}

export function describeTopologyItems(counts: TopologyItemCounts): string {
  const parts = [
    formatCount(counts.nodes, 'node'),
    formatCount(counts.links, 'link'),
    formatCount(counts.drawings, 'drawing'),
  ].filter((part): part is string => Boolean(part));

  if (parts.length <= 1) return parts[0] ?? '0 objects';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
}

function formatCount(count: number, singular: string): string | null {
  if (count === 0) return null;
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}
