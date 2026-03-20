import { EventEmitter, Injectable } from '@angular/core';
import { path } from 'd3-path';

import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';
import { LinkStyle } from '@models/link-style';
import { StyleTranslator} from './style-translator';

class EthernetLinkPath {
  constructor(public source: [number, number], public target: [number, number], public style: LinkStyle) {}
}

@Injectable()
export class EthernetLinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();
  private defaultEthernetLinkStyle : LinkStyle = {
    color: "#000000",
    width: 2,
    type: 0
  };

  constructor() {}

  private linktoEthernetLink(link: MapLink) {
    const hasValidColor = link.link_style && link.link_style.color;
    const hasValidWidth = link.link_style?.width && link.link_style.width >= this.defaultEthernetLinkStyle.width;

    const style: LinkStyle = hasValidColor
      ? {
          color: link.link_style.color,
          width: hasValidWidth ? link.link_style.width : this.defaultEthernetLinkStyle.width,
          type: link.link_style.type !== undefined ? link.link_style.type : this.defaultEthernetLinkStyle.type
        }
      : {
          color: this.defaultEthernetLinkStyle.color,
          width: hasValidWidth ? link.link_style.width : this.defaultEthernetLinkStyle.width,
          type: link.link_style?.type !== undefined ? link.link_style.type : this.defaultEthernetLinkStyle.type
        };

    return new EthernetLinkPath(
      [link.source.x + link.source.width / 2, link.source.y + link.source.height / 2],
      [link.target.x + link.target.width / 2, link.target.y + link.target.height / 2],
      style
    );
  }

  public draw(view: SVGSelection) {
    const link = view.selectAll<SVGPathElement, EthernetLinkPath>('path.ethernet_link').data((l) => {
      if (l.linkType === 'ethernet') {
        return [this.linktoEthernetLink(l)];
      }
      return [];
    });

    const link_enter = link
      .enter()
      .append<SVGPathElement>('path')
      .attr('class', 'ethernet_link')
      .attr('fill', 'none')
      .on('contextmenu', (datum) => {
        let link: MapLink = (datum as unknown) as MapLink;
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      })
      .attr('stroke', (datum) => {
        return datum.style.color;
      })
      .attr('stroke-width', (datum) => {
        return datum.style.width;
      })
      .attr('stroke-dasharray', (datum) => {
        return StyleTranslator.getLinkStyle(datum.style);
      });

    const link_merge = link.merge(link_enter);

    link_merge
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
      .attr('d', (ethernet) => {
        const line_generator = path();
        line_generator.moveTo(ethernet.source[0], ethernet.source[1]);
        line_generator.lineTo(ethernet.target[0], ethernet.target[1]);
        return line_generator.toString();
      });
  }
}
