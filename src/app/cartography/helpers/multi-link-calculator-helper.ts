import { Injectable } from '@angular/core';
import { MapLink } from '../models/map/map-link';

@Injectable()
export class MultiLinkCalculatorHelper {
  private static readonly DEFAULT_LINK_SPACING = 14;
  private static readonly DENSE_LINK_SPACING = 10;
  private static readonly MIN_LINK_SPACING = 6;
  private static readonly DENSE_BUNDLE_THRESHOLD = 4;
  private static readonly NODE_EDGE_PADDING = 8;

  public linkTranslation(
    distance: number,
    point0: { x: number; y: number },
    point1: { x: number; y: number }
  ): { dx: number; dy: number } {
    if (!distance) {
      return {
        dx: 0,
        dy: 0,
      };
    }

    const deltaX = point1.x - point0.x;
    const deltaY = point1.y - point0.y;
    const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (lineLength === 0) {
      return {
        dx: 0,
        dy: 0,
      };
    }

    const perpendicularX = -deltaY / lineLength;
    const perpendicularY = deltaX / lineLength;

    return {
      dx: perpendicularX * distance,
      dy: perpendicularY * distance,
    };
  }

  public assignDataToLinks(links: MapLink[]) {
    const linksFromNodes: { [key: string]: MapLink[] } = {};

    links.forEach((link: MapLink) => {
      if (!link.source || !link.target) {
        link.distance = 0;
        link.parallelLinksCount = 1;
        return;
      }

      const sid = link.source.id;
      const tid = link.target.id;
      const key = sid < tid ? `${sid},${tid}` : `${tid},${sid}`;

      if (!(key in linksFromNodes)) {
        linksFromNodes[key] = [];
      }
      linksFromNodes[key].push(link);
    });

    Object.keys(linksFromNodes).forEach((key) => {
      const groupedLinks = linksFromNodes[key];
      const center = (groupedLinks.length - 1) / 2;
      const spacing = this.calculateSpacingForGroup(groupedLinks);

      groupedLinks.forEach((link: MapLink, index: number) => {
        link.distance = (index - center) * spacing;
        link.parallelLinksCount = groupedLinks.length;
      });
    });
  }

  private calculateSpacingForGroup(groupedLinks: MapLink[]): number {
    if (groupedLinks.length <= MultiLinkCalculatorHelper.DENSE_BUNDLE_THRESHOLD) {
      return MultiLinkCalculatorHelper.DEFAULT_LINK_SPACING;
    }

    let spacing = MultiLinkCalculatorHelper.DENSE_LINK_SPACING;
    const maxSpacingFromNodeSize = this.getMaxSpacingFromNodeSize(groupedLinks);

    if (maxSpacingFromNodeSize > 0) {
      spacing = Math.min(spacing, maxSpacingFromNodeSize);
    }

    return Math.max(MultiLinkCalculatorHelper.MIN_LINK_SPACING, spacing);
  }

  private getMaxSpacingFromNodeSize(groupedLinks: MapLink[]): number {
    if (groupedLinks.length <= 1) {
      return MultiLinkCalculatorHelper.DEFAULT_LINK_SPACING;
    }

    const reference = groupedLinks[0];
    const sourceSpan = this.getNodeCrossSection(reference.source);
    const targetSpan = this.getNodeCrossSection(reference.target);

    if (!sourceSpan || !targetSpan) {
      return 0;
    }

    const availableSpan = Math.min(sourceSpan, targetSpan) - MultiLinkCalculatorHelper.NODE_EDGE_PADDING * 2;
    if (availableSpan <= 0) {
      return 0;
    }

    return availableSpan / (groupedLinks.length - 1);
  }

  private getNodeCrossSection(node: { width: number; height: number }): number {
    if (!node) {
      return 0;
    }

    const dimensions = [node.width, node.height].filter((value) => typeof value === 'number' && value > 0);
    if (dimensions.length === 0) {
      return 0;
    }

    return Math.min(...dimensions);
  }
}
