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
