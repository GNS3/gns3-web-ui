import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';

/**
 * Link display name ("iou-r-1 → iou-r-2") — the client-side join marker-manager
 * and the marker-replay windows share: the replay/aggregate APIs only know
 * `link_id`, names live in the cartography datasources (the same node names the
 * map shows). Falls back to the link UUID prefix once the link or either
 * endpoint node is gone from the datasources.
 *
 * `withEndpoints` appends each endpoint's interface label (marker-manager's
 * longer form, "iou-r-1 eth0/0 → iou-r-2 eth0/1"); the replay windows use the
 * short form.
 */
export function linkLabel(
  linkId: string,
  links: LinksDataSource,
  nodes: NodesDataSource,
  withEndpoints = false
): string {
  const link = links.get(linkId);
  const endpoints = link?.nodes;
  if (!endpoints || endpoints.length < 2) return linkId.slice(0, 8);
  const src = nodes.get(endpoints[0].node_id);
  const dst = nodes.get(endpoints[1].node_id);
  if (!src || !dst) return linkId.slice(0, 8);
  if (!withEndpoints) return `${src.name} → ${dst.name}`;
  const sLabel = endpoints[0].label?.text ?? '';
  const dLabel = endpoints[1].label?.text ?? '';
  return `${src.name} ${sLabel} → ${dst.name} ${dLabel}`.replace(/\s+/g, ' ').trim();
}
