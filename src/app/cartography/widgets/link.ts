import { Injectable } from '@angular/core';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { SerialLinkWidget } from './links/serial-link';
import { EthernetLinkWidget } from './links/ethernet-link';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { InterfaceLabelWidget } from './interface-label';
import { InterfaceStatusWidget } from './interface-status';
import { MapLink } from '../models/map/map-link';
import { SelectionManager } from '../managers/selection-manager';

@Injectable()
export class LinkWidget implements Widget {
  constructor(
    private multiLinkCalculatorHelper: MultiLinkCalculatorHelper,
    private interfaceLabelWidget: InterfaceLabelWidget,
    private interfaceStatusWidget: InterfaceStatusWidget,
    private selectionManager: SelectionManager
  ) {}

  public draw(view: SVGSelection) {
    const link_body = view.selectAll<SVGGElement, MapLink>('g.link_body').data(l => [l]);

    const link_body_enter = link_body
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'link_body');

    const link_body_merge = link_body.merge(link_body_enter).attr('transform', link => {
      const translation = this.multiLinkCalculatorHelper.linkTranslation(link.distance, link.source, link.target);
      return `translate (${translation.dx}, ${translation.dy})`;
    });

    link_body.select('.svg-icon').remove();

    link_body
      .filter(l => { return l.filters.frequency_drop })
      .append<SVGGElement>('g')
      .attr('class', 'svg-icon')
      .attr('transform', link => { 
        return `translate (${(link.source.x + link.target.x)/2}, ${(link.source.y + link.target.y)/2})`
      })
      .attr('viewBox', '0 0 20 20')
        .append<SVGPathElement>('path')
        .attr('d', "M18.125,15.804l-4.038-4.037c0.675-1.079,1.012-2.308,1.01-3.534C15.089,4.62,12.199,1.75,8.584,1.75C4.815,1.75,1.982,4.726,2,8.286c0.021,3.577,2.908,6.549,6.578,6.549c1.241,0,2.417-0.347,3.44-0.985l4.032,4.026c0.167,0.166,0.43,0.166,0.596,0l1.479-1.478C18.292,16.234,18.292,15.968,18.125,15.804 M8.578,13.99c-3.198,0-5.716-2.593-5.733-5.71c-0.017-3.084,2.438-5.686,5.74-5.686c3.197,0,5.625,2.493,5.64,5.624C14.242,11.548,11.621,13.99,8.578,13.99 M16.349,16.981l-3.637-3.635c0.131-0.11,0.721-0.695,0.876-0.884l3.642,3.639L16.349,16.981z");

    const serial_link_widget = new SerialLinkWidget();
    serial_link_widget.draw(link_body_merge);

    const ethernet_link_widget = new EthernetLinkWidget();
    ethernet_link_widget.draw(link_body_merge);

    link_body_merge
      .select<SVGPathElement>('path')
      .classed('selected', (l: MapLink) => this.selectionManager.isSelected(l));

    this.interfaceLabelWidget.draw(link_body_merge);
    this.interfaceStatusWidget.draw(link_body_merge);
  }
}
