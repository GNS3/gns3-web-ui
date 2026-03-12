import { Injectable } from '@angular/core';
import { MapLink } from '../models/map/map-link';

@Injectable()
export class MultiLinkCalculatorHelper {
  private static readonly DEFAULT_LINK_SPACING = 14;
  private static readonly DENSE_LINK_SPACING = 10;
  private static readonly MIN_LINK_SPACING = 6;
  private static readonly DENSE_BUNDLE_THRESHOLD = 4;
  private static readonly NODE_EDGE_PADDING = 8;
  private static readonly MAX_VISIBLE_DENSE_LINKS = 8;

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
      const spacing = this.calculateSpacingForGroup(groupedLinks);
      const visibleRange = this.getVisibleRange(groupedLinks.length);
      const overflowStackDistance = this.getOverflowStackDistance(groupedLinks.length, spacing);
      const visibleCenter = (visibleRange.count - 1) / 2;

      groupedLinks.forEach((link: MapLink, index: number) => {
        if (index < visibleRange.start || index > visibleRange.end) {
          link.distance = overflowStackDistance;
        } else {
          const visibleIndex = index - visibleRange.start;
          link.distance = (visibleIndex - visibleCenter) * spacing;
        }

        link.parallelLinksCount = groupedLinks.length;
      });
    });
  }

  private getVisibleRange(linkCount: number): { start: number; end: number; count: number } {
    if (linkCount <= MultiLinkCalculatorHelper.MAX_VISIBLE_DENSE_LINKS) {
      return {
        start: 0,
        end: Math.max(0, linkCount - 1),
        count: linkCount,
      };
    }

    const visibleLinksCount = this.getVisibleLinksCountForSpacing(linkCount);
    const hiddenLinksCount = linkCount - visibleLinksCount;
    const leftHiddenCount = Math.floor(hiddenLinksCount / 2);
    const start = leftHiddenCount;

    return {
      start,
      end: start + visibleLinksCount - 1,
      count: visibleLinksCount,
    };
  }

  private getOverflowStackDistance(linkCount: number, spacing: number): number {
    if (linkCount <= MultiLinkCalculatorHelper.MAX_VISIBLE_DENSE_LINKS) {
      return 0;
    }

    // Stack overflow links on middle visible link #5 when 8 dense links are shown.
    return spacing / 2;
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
    const visibleLinksCount = this.getVisibleLinksCountForSpacing(groupedLinks.length);

    if (visibleLinksCount <= 1) {
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

    return availableSpan / (visibleLinksCount - 1);
  }

  private getVisibleLinksCountForSpacing(linkCount: number): number {
    return Math.min(linkCount, MultiLinkCalculatorHelper.MAX_VISIBLE_DENSE_LINKS);
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
