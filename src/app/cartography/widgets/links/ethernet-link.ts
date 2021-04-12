import { EventEmitter, Injectable } from '@angular/core';
import { path } from 'd3-path';
import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';

class EthernetLinkPath {
  constructor(public source: [number, number], public target: [number, number]) {}
}

@Injectable()
export class EthernetLinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();

  constructor() {}

  private linktoEthernetLink(link: MapLink) {
    return new EthernetLinkPath(
      [link.source.x + link.source.width / 2, link.source.y + link.source.height / 2],
      [link.target.x + link.target.width / 2, link.target.y + link.target.height / 2]
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
      .on('contextmenu', (datum) => {
        let link: MapLink = (datum as unknown) as MapLink;
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      });

    link_enter
      .attr('stroke', '#000')
      .attr('stroke-width', '2')
      .on('contextmenu', (datum) => {
        let link: MapLink = (datum as unknown) as MapLink;
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      });

    const link_merge = link.merge(link_enter);

    link_merge.attr('d', (ethernet) => {
      const line_generator = path();
      line_generator.moveTo(ethernet.source[0], ethernet.source[1]);
      line_generator.lineTo(ethernet.target[0], ethernet.target[1]);
      return line_generator.toString();
    });
  }
}
