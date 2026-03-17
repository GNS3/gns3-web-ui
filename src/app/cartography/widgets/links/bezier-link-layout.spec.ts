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

  it('should fully separate two endpoints on the same face', () => {
    const layout = new BezierLinkLayout();
    const center = createNode('center', 200, 200);
    const upperRight = createNode('upper-right', 420, 80);
    const lowerRight = createNode('lower-right', 420, 320);
    const upperLink = createLink('upper-link', center, upperRight);
    const lowerLink = createLink('lower-link', center, lowerRight);

    layout.buildEndpointOrder([upperLink, lowerLink]);

    expect(layout.getEndpointOrder(upperLink, 0)).toEqual(-1);
    expect(layout.getEndpointOrder(lowerLink, 0)).toEqual(1);
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

  it('should not add extra internal label spacing for parallel bundles', () => {
    const layout = new BezierLinkLayout();
    const source = createNode('source', 0, 0);
    const target = createNode('target', 200, 0);
    const upperLink = createLink('link-upper', source, target);
    const lowerLink = createLink('link-lower', source, target);

    upperLink.parallelLinksCount = 3;
    lowerLink.parallelLinksCount = 3;
    upperLink.distance = 14;
    lowerLink.distance = -14;

    const sourceCenter: [number, number] = [source.x + source.width / 2, source.y + source.height / 2];
    const targetCenter: [number, number] = [target.x + target.width / 2, target.y + target.height / 2];

    layout.applyLabelRenderOffsets(upperLink, sourceCenter, targetCenter, 1, 150);
    layout.applyLabelRenderOffsets(lowerLink, sourceCenter, targetCenter, 1, 150);

    expect(upperLink.nodes[0].bezierRenderOffsetY).toBeCloseTo(lowerLink.nodes[0].bezierRenderOffsetY, 6);
    expect(upperLink.nodes[1].bezierRenderOffsetY).toBeCloseTo(lowerLink.nodes[1].bezierRenderOffsetY, 6);
  });

  it('should keep source and target endpoint fallback on the same lane', () => {
    const layout = new BezierLinkLayout();
    const sourceCenter: [number, number] = [20, 20];
    const targetCenter: [number, number] = [220, 20];
    const sourceOrientation: [number, number] = [1, 0];
    const targetOrientation: [number, number] = [-1, 0];
    const laneOffset = 14;

    const sourcePoint = layout.getEndpointPoint(sourceCenter, sourceOrientation, 0, laneOffset);
    const targetPoint = layout.getEndpointPoint(targetCenter, targetOrientation, 0, -laneOffset);

    expect(sourcePoint[1]).toEqual(targetPoint[1]);
  });

  it('should keep source and target endpoint order on the same lane with mirrored target order', () => {
    const layout = new BezierLinkLayout();
    const sourceCenter: [number, number] = [20, 20];
    const targetCenter: [number, number] = [220, 20];
    const sourceOrientation: [number, number] = [1, 0];
    const targetOrientation: [number, number] = [-1, 0];
    const order = 1;

    const sourcePoint = layout.getEndpointPoint(sourceCenter, sourceOrientation, order, 0);
    const targetPoint = layout.getEndpointPoint(targetCenter, targetOrientation, -order, 0);

    expect(sourcePoint[1]).toEqual(targetPoint[1]);
  });

  it('should avoid adding extra order spacing when distance-based parallel spacing is available', () => {
    const layout = new BezierLinkLayout();
    const source = createNode('source', 0, 0);
    const target = createNode('target', 200, 0);
    const linkA = createLink('link-a', source, target);
    const linkB = createLink('link-b', source, target);
    const linkC = createLink('link-c', source, target);

    layout.buildEndpointOrder([linkA, linkB, linkC]);

    linkA.parallelLinksCount = 3;
    linkB.parallelLinksCount = 3;
    linkC.parallelLinksCount = 3;
    linkA.distance = 14;
    linkB.distance = 14;
    linkC.distance = 14;

    const sourceCenter: [number, number] = [source.x + source.width / 2, source.y + source.height / 2];
    const targetCenter: [number, number] = [target.x + target.width / 2, target.y + target.height / 2];

    layout.applyLabelRenderOffsets(linkA, sourceCenter, targetCenter, 1, 150);
    layout.applyLabelRenderOffsets(linkB, sourceCenter, targetCenter, 1, 150);
    layout.applyLabelRenderOffsets(linkC, sourceCenter, targetCenter, 1, 150);

    expect(linkA.nodes[0].bezierRenderOffsetY).toBeCloseTo(linkB.nodes[0].bezierRenderOffsetY, 6);
    expect(linkB.nodes[0].bezierRenderOffsetY).toBeCloseTo(linkC.nodes[0].bezierRenderOffsetY, 6);
    expect(linkA.nodes[1].bezierRenderOffsetY).toBeCloseTo(linkB.nodes[1].bezierRenderOffsetY, 6);
    expect(linkB.nodes[1].bezierRenderOffsetY).toBeCloseTo(linkC.nodes[1].bezierRenderOffsetY, 6);
  });

  it('should preserve projection-sorted target order for fan-in topology', () => {
    const layout = new BezierLinkLayout();
    const center = createNode('center', 400, 300);
    const upperLeft = createNode('upper-left', 100, 100);
    const lowerLeft = createNode('lower-left', 100, 500);
    const upperLink = createLink('upper-link', upperLeft, center);
    const lowerLink = createLink('lower-link', lowerLeft, center);

    layout.buildEndpointOrder([upperLink, lowerLink]);

    const upperTargetOrder = layout.getRenderEndpointOrder(upperLink, 1);
    const lowerTargetOrder = layout.getRenderEndpointOrder(lowerLink, 1);

    // Target endpoints must stay in their natural projection order
    // so curves diverge instead of crossing.
    expect(upperTargetOrder).not.toEqual(lowerTargetOrder);
    expect(Math.abs(upperTargetOrder - lowerTargetOrder)).toBeGreaterThanOrEqual(2);
  });
});
