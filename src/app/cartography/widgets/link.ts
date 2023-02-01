import { EventEmitter, Injectable } from '@angular/core';
import { event } from 'd3-selection';
import { LinkContextMenu } from '../events/event-source';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { SelectionManager } from '../managers/selection-manager';
import { MapLink } from '../models/map/map-link';
import { SVGSelection } from '../models/types';
import { InterfaceLabelWidget } from './interface-label';
import { InterfaceStatusWidget } from './interface-status';
import { EthernetLinkWidget } from './links/ethernet-link';
import { SerialLinkWidget } from './links/serial-link';
import { Widget } from './widget';

@Injectable()
export class LinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();

  constructor(
    private multiLinkCalculatorHelper: MultiLinkCalculatorHelper,
    private interfaceLabelWidget: InterfaceLabelWidget,
    private interfaceStatusWidget: InterfaceStatusWidget,
    private selectionManager: SelectionManager,
    private ethernetLinkWidget: EthernetLinkWidget,
    private serialLinkWidget: SerialLinkWidget
  ) {}

  public draw(view: SVGSelection) {
    const link_body = view.selectAll<SVGGElement, MapLink>('g.link_body').data((l) => [l]);

    const link_body_enter = link_body.enter().append<SVGGElement>('g').attr('class', 'link_body');

    const link_body_merge = link_body.merge(link_body_enter).attr('transform', (link) => {
      const translation = this.multiLinkCalculatorHelper.linkTranslation(link.distance, link.source, link.target);
      return `translate (${translation.dx}, ${translation.dy})`;
    });

    link_body.select('.capture-icon').remove();
    link_body
      .filter((l) => {
        return (
          l.capturing &&
          !l.suspend &&
          !(l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'capture-icon')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('xlink:href', 'assets/resources/images/inspect.svg');

    link_body.select('.filter-capture-icon').remove();
    link_body
      .filter((l) => {
        return (
          l.capturing &&
          !l.suspend &&
          (l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'filter-capture-icon')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('xlink:href', 'assets/resources/images/filter-capture.svg');

    link_body.select('.filter-icon').remove();
    link_body
      .filter((l) => {
        return (
          !l.capturing &&
          !l.suspend &&
          (l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'filter-icon')
      .attr('width', '48px')
      .attr('height', '48px')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('width', '48px')
      .attr('height', '48px')
      .attr('xlink:href', 'assets/resources/images/filter.svg');

    link_body.select('.pause-icon').remove();
    link_body
      .filter((l) => {
        return (
          l.suspend
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'pause-icon')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('xlink:href', 'assets/resources/images/pause.svg');

    this.serialLinkWidget.draw(link_body_merge);
    this.ethernetLinkWidget.draw(link_body_merge);

    link_body_merge
      .select<SVGPathElement>('path')
      .classed('selected', (l: MapLink) => this.selectionManager.isSelected(l));

    this.interfaceLabelWidget.draw(link_body_merge);
    this.interfaceStatusWidget.draw(link_body_merge);
  }
}
