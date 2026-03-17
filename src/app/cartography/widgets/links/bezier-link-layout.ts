import { MapLink } from '../../models/map/map-link';
import { ConnectorOrientation, StyleTranslator } from './style-translator';

export class BezierLinkLayout {
  private readonly endpointOrder = new Map<string, number>();

  private getEndpointOrderKey(linkId: string | undefined, endpointIndex: number) {
    return `${linkId || ''}:${endpointIndex}`;
  }

  getEndpointOrder(link: MapLink, endpointIndex: number) {
    return this.endpointOrder.get(this.getEndpointOrderKey(link.id, endpointIndex)) || 0;
  }

  getEndpointPoint(
    center: [number, number],
    orientation: ConnectorOrientation,
    endpointOrder: number
  ): [number, number] {
    const tangentX = -orientation[1];
    const tangentY = orientation[0];
    const spread = 14;
    const offset = endpointOrder * spread;

    return [center[0] + tangentX * offset, center[1] + tangentY * offset];
  }

  buildEndpointOrder(links: MapLink[]) {
    this.endpointOrder.clear();
    const endpointsByNodeFace = new Map<
      string,
      Array<{ link: MapLink; endpointIndex: number; projection: number }>
    >();

    links.forEach((link) => {
      if (!link.source || !link.target || !link.nodes || link.nodes.length < 2) {
        return;
      }

      const normalizedLinkType = StyleTranslator.normalizeLinkType(link.link_style?.link_type);
      if (normalizedLinkType !== 'bezier') {
        return;
      }

      const sourceCenter: [number, number] = [link.source.x + link.source.width / 2, link.source.y + link.source.height / 2];
      const targetCenter: [number, number] = [link.target.x + link.target.width / 2, link.target.y + link.target.height / 2];

      const sourceNodeId = link.nodes[0].nodeId || link.source.id;
      const targetNodeId = link.nodes[1].nodeId || link.target.id;

      if (sourceNodeId) {
        const sourceOrientation = StyleTranslator.getContinuousOrientation(sourceCenter, targetCenter);
        const sourceFaceKey = `${sourceNodeId}:${sourceOrientation[0]},${sourceOrientation[1]}`;
        const sourceTangentX = -sourceOrientation[1];
        const sourceTangentY = sourceOrientation[0];
        const sourceVectorX = targetCenter[0] - sourceCenter[0];
        const sourceVectorY = targetCenter[1] - sourceCenter[1];
        const sourceProjection = sourceVectorX * sourceTangentX + sourceVectorY * sourceTangentY;

        const sourceEndpoints = endpointsByNodeFace.get(sourceFaceKey) || [];
        sourceEndpoints.push({ link, endpointIndex: 0, projection: sourceProjection });
        endpointsByNodeFace.set(sourceFaceKey, sourceEndpoints);
      }

      if (targetNodeId) {
        const targetOrientation = StyleTranslator.getContinuousOrientation(targetCenter, sourceCenter);
        const targetFaceKey = `${targetNodeId}:${targetOrientation[0]},${targetOrientation[1]}`;
        const targetTangentX = -targetOrientation[1];
        const targetTangentY = targetOrientation[0];
        const targetVectorX = sourceCenter[0] - targetCenter[0];
        const targetVectorY = sourceCenter[1] - targetCenter[1];
        const targetProjection = targetVectorX * targetTangentX + targetVectorY * targetTangentY;

        const targetEndpoints = endpointsByNodeFace.get(targetFaceKey) || [];
        targetEndpoints.push({ link, endpointIndex: 1, projection: targetProjection });
        endpointsByNodeFace.set(targetFaceKey, targetEndpoints);
      }
    });

    endpointsByNodeFace.forEach((endpoints) => {
      endpoints.sort((a, b) => a.projection - b.projection);
      const midpoint = (endpoints.length - 1) / 2;

      endpoints.forEach((endpoint, index) => {
        this.endpointOrder.set(
          this.getEndpointOrderKey(endpoint.link.id, endpoint.endpointIndex),
          index - midpoint
        );
      });
    });
  }

  clearLabelRenderOffsets(link: MapLink) {
    if (!link.nodes) {
      return;
    }

    link.nodes.forEach((node) => {
      node.bezierRenderOffsetX = 0;
      node.bezierRenderOffsetY = 0;
    });
  }

  applyLabelRenderOffsets(
    link: MapLink,
    sourceCenter: [number, number],
    targetCenter: [number, number],
    sideDirection: number,
    majorAnchor: number
  ) {
    if (!link.nodes || link.nodes.length < 2) {
      return;
    }

    const deltaX = targetCenter[0] - sourceCenter[0];
    const deltaY = targetCenter[1] - sourceCenter[1];
    const safeDistance = Math.hypot(deltaX, deltaY) || 1;
    const normalX = -deltaY / safeDistance;
    const normalY = deltaX / safeDistance;
    const normalizedSideDirection = sideDirection >= 0 ? 1 : -1;
    const offsetMagnitude = Math.min(16, Math.max(7, 7 + Math.abs(majorAnchor) * 0.03));
    const orderSpacing = 6;
    const sourceEndpointOrder = this.getEndpointOrder(link, 0);
    const targetEndpointOrder = this.getEndpointOrder(link, 1);
    const sourceOffset = offsetMagnitude * normalizedSideDirection + sourceEndpointOrder * orderSpacing;
    const targetOffset = -offsetMagnitude * normalizedSideDirection + targetEndpointOrder * orderSpacing;

    link.nodes[0].bezierRenderOffsetX = normalX * sourceOffset;
    link.nodes[0].bezierRenderOffsetY = normalY * sourceOffset;
    link.nodes[1].bezierRenderOffsetX = normalX * targetOffset;
    link.nodes[1].bezierRenderOffsetY = normalY * targetOffset;
  }

  getVariation(link: MapLink): number {
    const sourceEndpointOrder = this.getEndpointOrder(link, 0);
    const targetEndpointOrder = this.getEndpointOrder(link, 1);
    const orderSpread = (sourceEndpointOrder - targetEndpointOrder) * 6;

    return Math.round(Math.max(-24, Math.min(24, orderSpread)));
  }
}