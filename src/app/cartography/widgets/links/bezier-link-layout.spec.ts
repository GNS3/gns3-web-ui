import { MapLink } from '../../models/map/map-link';
import { MapLinkNode } from '../../models/map/map-link-node';
import { MapNode } from '../../models/map/map-node';
import { BezierLinkLayout } from './bezier-link-layout';

describe('BezierLinkLayout', () => {
  const createNode = (id: string, x: number, y: number): MapNode => {
    return {
      id,
      x,
      y,
      width: 40,
      height: 40,
    } as MapNode;
  };

  const createLink = (id: string, source: MapNode, target: MapNode, linkType: string = 'bezier'): MapLink => {
    return {
      id,
      source,
      target,
      link_style: {
        link_type: linkType,
      },
      nodes: [
        {
          id: `${id}-source`,
          nodeId: source.id,
          linkId: id,
        } as MapLinkNode,
        {
          id: `${id}-target`,
          nodeId: target.id,
          linkId: id,
        } as MapLinkNode,
      ],
    } as MapLink;
  };

  it('should ignore non-bezier links when building endpoint order', () => {
    const layout = new BezierLinkLayout();
    const source = createNode('source', 0, 0);
    const target = createNode('target', 200, 0);
    const straightLink = createLink('link-1', source, target, 'straight');

    layout.buildEndpointOrder([straightLink]);

    expect(layout.getEndpointOrder(straightLink, 0)).toEqual(0);
    expect(layout.getEndpointOrder(straightLink, 1)).toEqual(0);
  });

  it('should spread source endpoint order per node face for bezier links', () => {
    const layout = new BezierLinkLayout();
    const source = createNode('source', 0, 0);
    const topTarget = createNode('target-top', 200, -100);
    const midTarget = createNode('target-mid', 200, 0);
    const bottomTarget = createNode('target-bottom', 200, 100);

    const topLink = createLink('link-top', source, topTarget);
    const midLink = createLink('link-mid', source, midTarget);
    const bottomLink = createLink('link-bottom', source, bottomTarget);

    layout.buildEndpointOrder([topLink, midLink, bottomLink]);

    expect(layout.getEndpointOrder(topLink, 0)).toEqual(-1);
    expect(layout.getEndpointOrder(midLink, 0)).toEqual(0);
    expect(layout.getEndpointOrder(bottomLink, 0)).toEqual(1);
  });

  it('should apply and clear bezier label render offsets', () => {
    const layout = new BezierLinkLayout();
    const source = createNode('source', 0, 0);
    const target = createNode('target', 200, 0);
    const link = createLink('link-1', source, target);

    layout.buildEndpointOrder([link]);

    const sourceCenter: [number, number] = [source.x + source.width / 2, source.y + source.height / 2];
    const targetCenter: [number, number] = [target.x + target.width / 2, target.y + target.height / 2];

    layout.applyLabelRenderOffsets(link, sourceCenter, targetCenter, 1, 150);

    expect(link.nodes[0].bezierRenderOffsetX).toBeCloseTo(0, 6);
    expect(link.nodes[1].bezierRenderOffsetX).toBeCloseTo(0, 6);
    expect(link.nodes[0].bezierRenderOffsetY).toBeGreaterThan(0);
    expect(link.nodes[1].bezierRenderOffsetY).toBeLessThan(0);

    layout.clearLabelRenderOffsets(link);

    expect(link.nodes[0].bezierRenderOffsetX).toEqual(0);
    expect(link.nodes[0].bezierRenderOffsetY).toEqual(0);
    expect(link.nodes[1].bezierRenderOffsetX).toEqual(0);
    expect(link.nodes[1].bezierRenderOffsetY).toEqual(0);
  });
});
