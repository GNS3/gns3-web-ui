import { Injectable } from '@angular/core';
import { select } from 'd3-selection';
import { Project } from '@models/project';
import { Context } from '../models/context';

/**
 * Anchors the background grid patterns to the scene grid in screen space.
 *
 * The grid patterns (patternUnits="userSpaceOnUse") live at the SVG root,
 * outside the transformed g.canvas group, so their tile size and origin must
 * be derived from the canvas transform: the scene origin (0,0) sits at
 * centerX/centerY + pan, and one grid cell measures grid_size * k screen
 * pixels. Anchoring the pattern origin to (scene origin mod tile) makes the
 * visible grid coincide with the coordinates snap-to-grid rounds to, and
 * keeps it glued to the content through pans, zooms and canvas resizes.
 *
 * The old computation anchored the pattern to "canvas size / 2 mod grid_size".
 * Node drags resize the canvas (grow while dragging, full recalc on drag
 * end), so every drag recomputed a different anchor and the whole background
 * grid jumped — the "grid wobbles when I drag a node" bug. It also ignored
 * pan/zoom entirely, detaching the grid from the scene grid.
 */
@Injectable()
export class GridAnchorService {
  apply(svgElement: SVGSVGElement, context: Context, project: Project) {
    this.anchor(svgElement, context, project?.grid_size, '#gridNode');
    this.anchor(svgElement, context, project?.drawing_grid_size, '#gridDrawing');
  }

  private anchor(svgElement: SVGSVGElement, context: Context, gridSize: number | undefined, patternId: string) {
    const pattern = select(svgElement).select<SVGPatternElement>(patternId);
    if (pattern.empty() || !gridSize || gridSize <= 0) {
      return;
    }

    const scale = context.transformation?.k || 1;
    const tile = gridSize * scale;
    const originX = context.getZeroZeroTransformationPoint().x + (context.transformation?.x || 0);
    const originY = context.getZeroZeroTransformationPoint().y + (context.transformation?.y || 0);

    // userSpaceOnUse patterns tile from their x/y; any point congruent to the
    // scene origin (mod tile) draws the same grid, so normalize to keep the
    // attribute values small.
    pattern.attr('x', mod(originX, tile)).attr('y', mod(originY, tile)).attr('width', tile).attr('height', tile);
    pattern.select('path').attr('d', `M ${tile} 0 L 0 0 0 ${tile}`);
  }
}

function mod(value: number, m: number): number {
  return ((value % m) + m) % m;
}
