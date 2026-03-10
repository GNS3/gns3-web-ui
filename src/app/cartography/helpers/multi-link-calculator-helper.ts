import { Injectable } from '@angular/core';
import { MapLink } from '../models/map/map-link';

@Injectable()
export class MultiLinkCalculatorHelper {
  private static readonly LINK_SPACING = 14;

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

      groupedLinks.forEach((link: MapLink, index: number) => {
        link.distance = (index - center) * MultiLinkCalculatorHelper.LINK_SPACING;
      });
    });
  }
}
