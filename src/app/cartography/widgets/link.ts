import { Injectable, EventEmitter } from '@angular/core';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { SerialLinkWidget } from './links/serial-link';
import { EthernetLinkWidget } from './links/ethernet-link';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { InterfaceLabelWidget } from './interface-label';
import { InterfaceStatusWidget } from './interface-status';
import { MapLink } from '../models/map/map-link';
import { SelectionManager } from '../managers/selection-manager';
import { LinkContextMenu } from '../events/event-source';

@Injectable()
export class LinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();

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

    link_body.select('.capture-icon').remove();
    link_body
      .filter(l => { return l.capturing && !(l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)})
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        event.preventDefault();
        this.onContextMenu.emit(new LinkContextMenu(event, datum));
      })
      .attr('class', 'capture-icon')
      .attr('transform', link => { 
        return `translate (${(link.source.x + link.target.x)/2}, ${(link.source.y + link.target.y)/2}) scale(0.5)`
      })
      .attr('viewBox', '0 0 20 20')
        .append<SVGImageElement>('image')
        .attr("xlink:href", "assets/resources/images/inspect.svg");

    link_body.select('.filter-capture-icon').remove();
    link_body
      .filter(l => { return l.capturing && (l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)})
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        event.preventDefault();
        this.onContextMenu.emit(new LinkContextMenu(event, datum));
      })
      .attr('class', 'filter-capture-icon')
      .attr('transform', link => { 
        return `translate (${(link.source.x + link.target.x)/2}, ${(link.source.y + link.target.y)/2}) scale(0.5)`
      })
      .attr('viewBox', '0 0 20 20')
        .append<SVGImageElement>('image')
        .attr("xlink:href", "assets/resources/images/filter-capture.svg");

    link_body.select('.filter-icon').remove();
    link_body
      .filter(l => { return !l.capturing && (l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)})
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        event.preventDefault();
        this.onContextMenu.emit(new LinkContextMenu(event, datum));
      })
      .attr('class', 'filter-icon')
      .attr('transform', link => { 
        return `translate (${(link.source.x + link.target.x)/2}, ${(link.source.y + link.target.y)/2}) scale(0.5)`
      })
      .attr('viewBox', '0 0 20 20')
        .append<SVGImageElement>('image')
        .attr("xlink:href", "assets/resources/images/filter.svg");

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
