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
  if (affected.additions.nodes.length > 0 || affected.removals.nodes.length > 0) needsFullDraw = true;
  if (affected.additions.links.length > 0 || affected.removals.links.length > 0) needsFullDraw = true;
  if (affected.additions.drawings.length > 0 || affected.removals.drawings.length > 0) needsFullDraw = true;

  if (needsFullDraw) return true;

  // ── Node / Drawing targeted updates ──
  const nodes = graphDataManager.getNodes();
  const drawings = graphDataManager.getDrawings();

  for (const [itemId, groups] of affected.updates) {
    const onlyXy = groups.length === 1 && groups[0] === 'xY';
    const onlyXyZ  = groups.every((g) => g === 'xY' || g === 'z');
    const onlyLabel = groups.length === 1 && groups[0] === 'label';

    // Node: only xY (or xY+z) → targeted transform
    if (onlyXyZ && nodes.some((n) => n.id === itemId)) {
      const node = nodes.find((n) => n.id === itemId);
      if (node) {
        svg
          .select(`g.node[node_id="${d3SelectEscape(itemId)}"]`)
          .select<SVGGElement>('g.node_body')
          .attr('transform', `translate(${node.x}, ${node.y})`);
      }
      continue;
    }

    // Node: only label → targeted text update + getBBox (only that label)
    if (onlyLabel && nodes.some((n) => n.id === itemId)) {
      const node = nodes.find((n) => n.id === itemId);
      if (node && node.label) {
        const label = node.label;
        const labelSel = svg.select(`g.node[node_id="${d3SelectEscape(itemId)}"]`).select('text.label');
        if (!labelSel.empty()) {
          labelSel
            .attr('style', (label as any).style)
            .text((label as any).text)
            .attr('x', (label as any).x)
            .attr('y', (label as any).y);
          // Recompute the label selection rect bbox
          const bbox = (labelSel.node() as SVGTextElement | null)?.getBBox();
          if (bbox) {
            svg
              .select(`g.node[node_id="${d3SelectEscape(itemId)}"]`)
              .select('rect.label_selection')
              .attr('x', bbox.x)
              .attr('y', bbox.y)
              .attr('width', bbox.width)
              .attr('height', bbox.height);
          }
        }
      }
      continue;
    }

    // Drawing: only xY (or xY+z) → targeted transform
    if (onlyXyZ && drawings.some((d) => d.id === itemId)) {
      const drawing = drawings.find((d) => d.id === itemId);
      if (drawing) {
        svg
          .select(`g.drawing[drawing_id="${d3SelectEscape(itemId)}"]`)
          .select<SVGGElement>('g.drawing_body')
          .attr('transform', `translate(${drawing.x}, ${drawing.y}) rotate(${drawing.rotation})`);
      }
      continue;
    }

    // Anything else → fall through to full draw
    needsFullDraw = true;
  }

  return needsFullDraw;
}

/** Escape a string for use in a CSS attribute selector (node_id / link_id). */
function d3SelectEscape(id: string): string {
  return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
