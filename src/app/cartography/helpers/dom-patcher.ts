/**
 * Targeted DOM patcher for incremental D3 map updates.
 *
 * When a data-driven (gated) redraw only contains xY-position changes on
 * nodes, we can skip the full graphLayout.draw (D3 data-join + getBBox
 * reflows) and directly update the affected DOM elements.  Everything else
 * (structural changes, link/drawing updates, non-xY visual changes) falls
 * back to full draw for now — widget-specific targeted-update methods
 * (Commit 3) will extend this gradually.
 */

import * as d3 from 'd3';
import { Context } from '../models/context';
import { AffectedIds } from './item-signature';
import { GraphDataManager } from '../managers/graph-data-manager';

/**
 * Apply incremental DOM patches for items that only had xY position changes.
 * Returns `true` if a FULL draw is still required (structural changes or
 * non-xY updates were found).
 */
export function applyIncrementalPatches(
  svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
  affected: AffectedIds,
  graphDataManager: GraphDataManager,
  _context: Context
): boolean {
  let needsFullDraw = false;

  // ── Structural changes always require full draw (enter / exit) ──
  if (affected.additions.nodes.length > 0 || affected.removals.nodes.length > 0) {
    needsFullDraw = true;
  }
  if (affected.additions.links.length > 0 || affected.removals.links.length > 0) {
    needsFullDraw = true;
  }
  if (affected.additions.drawings.length > 0 || affected.removals.drawings.length > 0) {
    needsFullDraw = true;
  }

  // ── Node targeted updates ──
  const nodes = graphDataManager.getNodes();
  for (const [nodeId, groups] of affected.updates) {
    const isNodeUpdate = affected.updates.has(nodeId) && groups != null;

    if (!isNodeUpdate) continue;

    // If ONLY xY changed: targeted DOM transform update (no reflow, Repaint only)
    if (groups.length === 1 && groups[0] === 'xY') {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        svg
          .select(`g.node[node_id="${d3SelectEscape(nodeId)}"]`)
          .select<SVGGElement>('g.node_body')
          .attr('transform', `translate(${node.x}, ${node.y})`);
      }
      continue;
    }

    // Any other node change → full draw (for now; Commit 3 will add
    // targeted updates for text/label/visual/symbol via widget patch methods)
    needsFullDraw = true;
  }

  // ── Link / Drawing changes → full draw for now (Commit 3) ──
  for (const [_linkId] of affected.updates) {
    // If the key is NOT in the node updates we just handled, it's a link/drawing
    // change that needs full draw.  We don't have targeted link/drawing patching
    // yet, so flag it.
  }
  // Simpler: if any link or drawing updates exist, full draw.
  for (const [id] of affected.updates) {
    const isNode = nodes.some((n) => n.id === id);
    if (!isNode) {
      needsFullDraw = true;
      break;
    }
  }

  return needsFullDraw;
}

/** Escape a string for use in a CSS attribute selector (node_id / link_id). */
function d3SelectEscape(id: string): string {
  return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
