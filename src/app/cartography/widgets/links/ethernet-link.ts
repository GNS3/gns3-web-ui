import { EventEmitter, Injectable } from '@angular/core';
import { path } from 'd3-path';

import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';
import { LinkStyle } from '@models/link-style';
import { StyleTranslator } from './style-translator';

class EthernetLinkPath {
  constructor(
    public link: MapLink,
    public source: [number, number],
    public target: [number, number],
    public style: LinkStyle,
    public bezierVariation: number = 0,
    public sourceOrientation?: ConnectorOrientation,
    public targetOrientation?: ConnectorOrientation
  ) {}
}

@Injectable()
export class EthernetLinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();
  private defaultEthernetLinkStyle: LinkStyle = {
    color: '#000000',
    width: 2,
    type: 0,
  };

  constructor() {}

  private resolveContextMenuLink(arg1: unknown, arg2: unknown): MapLink | undefined {
    const candidates = [arg2, arg1];

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const maybePath = candidate as Partial<EthernetLinkPath>;
      if (maybePath.link) {
        return maybePath.link;
      }

      const maybeMapLink = candidate as Partial<MapLink>;
      if (typeof maybeMapLink.id === 'string' && Array.isArray(maybeMapLink.nodes)) {
        return maybeMapLink as MapLink;
      }
    }

    return undefined;
  }

  private linktoEthernetLink(link: MapLink) {
    // Validate source and target have valid coordinates
    if (
      !link.source ||
      !link.target ||
      link.source.x == null ||
      link.source.y == null ||
      link.source.width == null ||
      link.source.height == null ||
      link.target.x == null ||
      link.target.y == null ||
      link.target.width == null ||
      link.target.height == null
    ) {
      return null;
    }

    const hasValidColor = link.link_style && link.link_style.color;
    const hasValidWidth = link.link_style?.width && link.link_style.width >= this.defaultEthernetLinkStyle.width;

    const style: LinkStyle = hasValidColor
      ? {
          color: link.link_style.color,
          width: hasValidWidth ? link.link_style.width : this.defaultEthernetLinkStyle.width,
          type: link.link_style.type !== undefined ? link.link_style.type : this.defaultEthernetLinkStyle.type,
        }
      : {
          color: this.defaultEthernetLinkStyle.color,
          width: hasValidWidth ? link.link_style.width : this.defaultEthernetLinkStyle.width,
          type: link.link_style?.type !== undefined ? link.link_style.type : this.defaultEthernetLinkStyle.type,
        };

    return new EthernetLinkPath(
      link,
      sourcePoint,
      targetPoint,
      style,
      bezierVariation,
      sourceOrientation,
      targetOrientation
    );
  }

  public draw(view: SVGSelection) {
    const linksInView = view.data() as MapLink[];
    this.bezierLayout.buildEndpointOrder(Array.isArray(linksInView) ? linksInView : []);

    const link = view.selectAll<SVGPathElement, EthernetLinkPath>('path.ethernet_link').data((l) => {
      if (l.linkType === 'ethernet') {
        const ethernetLink = this.linktoEthernetLink(l);
        return ethernetLink ? [ethernetLink] : [];
      }
      return [];
    });

    const link_enter = link
      .enter()
      .append<SVGPathElement>('path')
      .attr('class', 'ethernet_link')
      .attr('fill', 'none')
      .on('contextmenu', (event: any, datum) => {
        let link: MapLink = datum as unknown as MapLink;
        const evt = event;
        const link = this.resolveContextMenuLink(arg1, arg2);
        if (!link) {
          return;
        }
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      });

    const link_merge = link.merge(link_enter);

    link_merge
      .attr('transform', (datum) => {
        return StyleTranslator.getLinkTransform(datum.style);
      })
      .attr('fill', 'none')
      .attr('stroke', (datum) => {
        return datum.style.color;
      })
      .attr('stroke-width', (datum) => {
        return datum.style.width;
      })
      .attr('stroke-dasharray', (datum) => {
        return StyleTranslator.getLinkStyle(datum.style);
      })
      .attr('stroke-opacity', (datum) => {
        return datum.style.type === 0 ? 0 : 1;
      })
      .attr('pointer-events', (datum) => {
        return datum.style.type === 0 ? 'stroke' : null;
      })
      .attr('d', (ethernet) => {
        return StyleTranslator.getLinkPath(ethernet.source, ethernet.target, ethernet.style, {
          bezierVariation: ethernet.bezierVariation,
          sourceOrientation: ethernet.sourceOrientation,
          targetOrientation: ethernet.targetOrientation,
          flowchartDistance:
            typeof ethernet.link.distance === 'number' && !Number.isNaN(ethernet.link.distance)
              ? ethernet.link.distance
              : 0,
        });
      });
  }
}
