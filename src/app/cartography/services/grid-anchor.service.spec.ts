import { select } from 'd3-selection';
import { beforeEach, describe, expect, it } from 'vitest';
import { Context } from '../models/context';
import { Size } from '../models/size';
import { GridAnchorService } from './grid-anchor.service';

/**
 * The grid patterns live at the SVG root, outside the transformed g.canvas
 * group, so their anchor must be derived from the canvas transform: tile =
 * grid_size * k, origin ≡ scene origin (centerX/Y + pan, mod tile). The old
 * size/2-based anchor jumped whenever a node drag resized the canvas — the
 * "background grid wobbles when dragging" bug these tests pin down.
 */
describe('GridAnchorService', () => {
  let service: GridAnchorService;
  let context: Context;
  let svg: SVGSVGElement;

  beforeEach(() => {
    service = new GridAnchorService();
    context = new Context();
    context.size = new Size(2000, 1000);
    context.centerX = 700;
    context.centerY = 400;
    context.transformation.x = 0;
    context.transformation.y = 0;
    context.transformation.k = 1;

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const defs = select(svg).append('defs');
    for (const id of ['gridNode', 'gridDrawing']) {
      defs
        .append('pattern')
        .attr('id', id)
        .attr('patternUnits', 'userSpaceOnUse')
        .append('path')
        .attr('fill', 'none');
    }
  });

  const pattern = (id: string) => select(svg).select<SVGPatternElement>(`#${id}`);

  it('anchors the tile to grid_size and the origin to the scene origin', () => {
    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    // 700 mod 75 = 25, 400 mod 75 = 25
    expect(pattern('gridNode').attr('width')).toBe('75');
    expect(pattern('gridNode').attr('height')).toBe('75');
    expect(pattern('gridNode').attr('x')).toBe('25');
    expect(pattern('gridNode').attr('y')).toBe('25');
    expect(pattern('gridNode').select('path').attr('d')).toBe('M 75 0 L 0 0 0 75');
  });

  it('anchors the drawing grid to its own drawing_grid_size', () => {
    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    expect(pattern('gridDrawing').attr('width')).toBe('25');
    // 700 mod 25 = 0
    expect(pattern('gridDrawing').attr('x')).toBe('0');
  });

  it('scales the tile with the zoom factor', () => {
    context.transformation.k = 2;

    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    // tile 150; 700 mod 150 = 100
    expect(pattern('gridNode').attr('width')).toBe('150');
    expect(pattern('gridNode').attr('x')).toBe('100');
  });

  it('shifts the anchor by the pan', () => {
    context.transformation.x = -30;
    context.transformation.y = 5;

    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    // (700 - 30) mod 75 = 70, (400 + 5) mod 75 = 30
    expect(pattern('gridNode').attr('x')).toBe('70');
    expect(pattern('gridNode').attr('y')).toBe('30');
  });

  it('normalizes negative origins to a positive pattern offset', () => {
    context.centerX = 0;
    context.centerY = 0;
    context.transformation.x = -10;
    context.transformation.y = -10;

    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    expect(pattern('gridNode').attr('x')).toBe('65');
    expect(pattern('gridNode').attr('y')).toBe('65');
  });

  it('falls back to size/2 when the origin is not anchored yet (centerX null)', () => {
    context.centerX = null;
    context.centerY = null;

    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    // 2000/2 mod 75 = 25, 1000/2 mod 75 = 50
    expect(pattern('gridNode').attr('x')).toBe('25');
    expect(pattern('gridNode').attr('y')).toBe('50');
  });

  it('does not move the anchor when only the canvas size changes (the drag bug)', () => {
    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);
    const before = pattern('gridNode').attr('x');

    // What a node drag does: grow during the drag, full recalc on drag end.
    context.size = new Size(4000, 2000);
    service.apply(svg, context, { grid_size: 75, drawing_grid_size: 25 } as never);

    expect(pattern('gridNode').attr('x')).toBe(before);
  });

  it('leaves the patterns untouched when grid sizes are missing or invalid', () => {
    pattern('gridNode').attr('x', '999');

    service.apply(svg, context, {} as never);
    service.apply(svg, context, { grid_size: 0, drawing_grid_size: -5 } as never);

    expect(pattern('gridNode').attr('x')).toBe('999');
  });

  it('is a no-op when the patterns are not in the DOM (grid hidden)', () => {
    const empty = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    expect(() => service.apply(empty, context, { grid_size: 75 } as never)).not.toThrow();
  });
});
