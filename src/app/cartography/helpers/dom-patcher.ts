/**
 * Targeted DOM patcher for incremental D3 map updates.
 *
 * When a data-driven (gated) redraw only contains xY-position changes on
 * nodes/drawings, we can skip the full graphLayout.draw (D3 data-join +
 * getBBox reflows) and directly update the affected DOM elements. Everything
 * else (structural changes, link path changes, z/layer changes, non-xY visual
 * changes) falls back to full draw.
 */

import * as d3 from 'd3';
import { Context } from '../models/context';
import { AffectedIds } from './item-signature';
import { GraphDataManager } from '../managers/graph-data-manager';

/**
 * Apply incremental DOM patches. Returns `true` if a FULL draw is still
 * required (structural changes, z/layer migration, link recompute, label
 * updates, or any non-xY visual change).
 */
export function applyIncrementalPatches(
  svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
  affected: AffectedIds,
  graphDataManager: GraphDataManager,
  _context: Context
): boolean {
  // Structural changes always need enter/exit → full draw.
  if (
    affected.additions.nodes.length > 0 ||
    affected.removals.nodes.length > 0 ||
    affected.additions.links.length > 0 ||
    affected.removals.links.length > 0 ||
    affected.additions.drawings.length > 0 ||
    affected.removals.drawings.length > 0
  ) {
    return true;
  }
  if (affected.updates.size === 0) return false;

  // O(1) lookup maps (one O(N) pass instead of K×O(N) .some()/.find()).
  const nodesById = new Map(graphDataManager.getNodes().map((n) => [n.id, n]));
  const drawingsById = new Map(graphDataManager.getDrawings().map((d) => [d.id, d]));

  let needsFullDraw = false;

  for (const [itemId, groups] of affected.updates) {
    const onlyXy = groups.length === 1 && groups[0] === 'xY';

    // Node: only xY → targeted transform (no reflow)
    // NOTE: z is intentionally NOT included here — z changes migrate the item
    // between <g class="layer"> containers, which requires a full draw.
    if (onlyXy) {
      const node = nodesById.get(itemId);
      if (node) {
        // Match NodeWidget.draw / NodesWidget.updateNodePosition: nodes
        // without a width are offset by -30 (legacy symbol-only fallback).
        const o = node.width ? 0 : -30;
        svg
          .select(`g.node[node_id="${d3SelectEscape(itemId)}"]`)
          .select<SVGGElement>('g.node_body')
          .attr('transform', `translate(${node.x + o}, ${node.y + o})`);
        continue;
      }
      // Drawing: only xY → targeted transform
      const drawing = drawingsById.get(itemId);
      if (drawing) {
        svg
          .select(`g.drawing[drawing_id="${d3SelectEscape(itemId)}"]`)
          .select<SVGGElement>('g.drawing_body')
          .attr('transform', `translate(${drawing.x}, ${drawing.y}) rotate(${drawing.rotation})`);
        continue;
      }
    }

    // Anything else (z/layer change, link path recompute, label update,
    // multi-field, unknown) → full draw. Labels in particular MUST go through
    // the full LabelWidget pipeline (cssFixer / fontFixer /
    // removeInlineFillColor) — writing the raw server style string drops
    // unitless font-size declarations and re-introduces inline fills that
    // override the theme.
    needsFullDraw = true;
  }

  return needsFullDraw;
}

/** Escape a string for use in a CSS attribute selector (node_id / link_id). */
function d3SelectEscape(id: string): string {
  return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
